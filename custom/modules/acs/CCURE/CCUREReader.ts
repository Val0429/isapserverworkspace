import { Config } from 'core/config.gen';
import { isNullOrUndefined, isNull } from "util";
import { toArray } from "rxjs/operator/toArray";
import { SignalObject } from "./signalObject";
import queryMap, { IQueryParam, QueryContent, IQueryMap } from './queryMap'

enum StateCode {
    Wait = 0,
    Success = 1,
    Error = 2
}

export class CCUREReader {

    protected static _instance: CCUREReader = undefined;

    protected _isConnected: boolean;

    protected _sql;

    protected _conn;

    protected _bacthCount = 1000;

    protected _lastQueryTime: Date;

    protected _signalRead: SignalObject = new SignalObject(false);

    protected constructor() {
        this._sql = require("mssql");
        this._conn = undefined;
        this._isConnected = false;

        
    }

    /**
     * Return CCUREReader instance
     */
    public static getInstance(): CCUREReader {
        if (isNullOrUndefined(this._instance) === true){
            this._instance = new CCUREReader();
            const fs = require('fs');
            fs.readFile('./workspace/custom/modules/acs/CCURE/ReportQueryTimeSavedFile.tmp', function (err, data) {
            
                if (err || isNullOrUndefined( data)) {
                    console.log("=>Read ReportQueryTimeSavedFile.tmp file failed");
                    CCUREReader._instance.setLastReportQueryTime(new Date("1970-01-01T00:00:00.000"));
                }
                else {
                    CCUREReader._instance.setLastReportQueryTime(new Date(data.toString('utf8')));
                    console.log("=>ReportQueryTimeSavedFile.tmp file was loaded!");
                }
                CCUREReader._instance._signalRead.set(true);
            });
        }
        return this._instance;
    }

    /**
     * Connect
     */
    public async connectAsync(): Promise<void> {
        if (this._isConnected) return;
        if (isNullOrUndefined(Config.CCUREconnect) === true) throw `Internal Error: <CCUREReader::connectAsync> config is equal null or undefined.`;
        if (Config.CCUREconnect.database === "") throw `Internal Error: <CCUREReader::connectAsync> config.odbcDSN cannot be empty`;
        this.verifyIP(Config.CCUREconnect.server);
        this.verifyPort(Config.CCUREconnect.port);

        this._conn = new this._sql.ConnectionPool(Config.CCUREconnect);

        try {
            return await this._conn.connect().then(() => {
                this._isConnected = true;
                console.log(`=>Connect Successful`);
            });
        }
        catch (err) {
            this._conn = null;
            return Promise.reject(`Internal Error: <CCUREReader::connectAsync> Try connect error : ${err}.`);
        }
    }

    /**
     * Disconnect
     */
    public async disconnectAsync(): Promise<void> {
        if (this._isConnected === false) return;
        else {
            try{
                await this._conn.close().then(() => {
                    this._isConnected = false;
                    console.log(`=>Disonnect  successful`);
                });
            }
            catch(ex){
                throw ex;
            }
            
            return Promise.resolve();
        }
    }

    /**
     * Query Data with Stream Transmitted
     * @param queryContent QueryContent => Persons, Users, Doors, or Reports
     * @param OnDatareceived void OnDatareceived(row) : callback when receive data, row => JSON string per row
     * @param OnDone void OnDone(result) : callback when finish receive, result => number of result
     * @param OnErr void OnErr(err) : callback when error happened, err => error reason
     * @return Return sample : 
     * { doorId: 2087, doorName: 'D001', unlockTime: 5, shuntTime: 10 }
     */
    public async queryStreamAsync(queryContent: QueryContent,
                                    OnDatareceived: (rows: JSON[], queryContent: QueryContent) => void,
                                    OnDone?: (result: JSON, queryContent: QueryContent) => void,
                                    OnError?: (err, queryContent: QueryContent) => void,
                                    condition?: String): Promise<void> {

        if (this._isConnected === false) throw `Internal Error: <CCUREReader::queryStream> No connection with SQL server`;
        if (isNullOrUndefined(OnDatareceived) === true) throw `Internal Error: <CCUREReader::queryStream> OnDatareceived cannot be null`;

        let queryParam: IQueryParam = queryMap[queryContent];

        let request = new this._sql.Request(this._conn);
        request.stream = true;

        queryParam.OnReceivedData = OnDatareceived;
        queryParam.OnDone = OnDone;
        queryParam.OnError = OnError;

        await this._signalRead.wait(10000);

        let queryCmd = this.generateQueryString(queryContent, queryParam, condition);
        if (queryContent === QueryContent.ReportsNewUpdate) this.updateReportQueryTime();

        console.log(`=>Send SQL command ${queryCmd}`);
        request.query(queryCmd);

        let rowsToProcess: JSON[] = [];

        let processRows = () => {
            queryParam.OnReceivedData(rowsToProcess, queryContent);
            rowsToProcess = [];
            request.resume();
        };

        request.on('row', row => {
            rowsToProcess.push(row);
            if (rowsToProcess.length >= this._bacthCount) {
                request.pause();
                processRows();
            }
        });
        request.on('done', result => {
            processRows();
            if (isNullOrUndefined(queryParam.OnDone) === false) queryParam.OnDone(result, queryContent);
        });
        request.on('error', err => {
            if (isNullOrUndefined(queryParam.OnError) === false) queryParam.OnError(err, queryContent);
            this.defaultErrCalback(err, queryContent)
        });
    }

    /**
     * Query Data 
     * @param queryContent QueryContent => Persons, Users, Doors, or Reports
     * @param timeout set timeout
     * @return Sample : 
     * [ 
     *      { clearId: 1605, clearName: '$預設的許可表' },
     *      { clearId: 2096, clearName: '全開門' },
     *      { clearId: 2133, clearName: 'Door1' },
     *      { clearId: 2134, clearName: 'Door2' },
     *      { clearId: 2202, clearName: 'AutoImportTest1' },
     *      { clearId: 2204, clearName: 'qqq6' },
     *      { clearId: 2205, clearName: 'qqq7' } 
     * ]
     */
    public async queryAllAsync(queryContent: QueryContent, condition?: String, timeout: number = 3000): Promise<Array<JSON>> {

        if (this._isConnected === false) throw `Internal Error: <CCUREReader::queryStream> No connection with SQL server`;

        let queryParam: IQueryParam = queryMap[queryContent];

        //Use to wait ( read/write after connected)
        let signal: SignalObject<StateCode> = new SignalObject<StateCode>(StateCode.Wait);

        let rowList: Array<JSON> = [];
        let errorStr: string;

        let request = new this._sql.Request(this._conn);
        request.stream = true;

        await this._signalRead.wait(10000);

        let queryCmd = this.generateQueryString(queryContent, queryParam, condition);
        if (queryContent === QueryContent.ReportsNewUpdate) this.updateReportQueryTime();

        console.log(`=>Send SQL command ${queryCmd}`);

        request.query(queryCmd);
        request.on('row', row => rowList.push(row));
        request.on('done', result => signal.set(StateCode.Success));
        request.on('error', err => {
            signal.set(StateCode.Error);
            this.defaultErrCalback(err, queryContent)
        });

        let result: StateCode = await signal.wait(timeout < 1 ? null : timeout, v => (v != StateCode.Wait));

        if (result == StateCode.Success) return Promise.resolve(rowList);
        else return Promise.reject(errorStr);
    }

    /**
     * Return last query report time unix timestamp
     */
    public getLastReportQueryTime(): Date {
        return this._lastQueryTime;
    }

    /**
     * Set last query report time unix timestamp
     * Please assign the value from previus time get from getLastReportQueryTime()
     * It use to avoid server restart then query duplicate data
     */
    public setLastReportQueryTime(timeVal: Date): void {
        this._lastQueryTime = timeVal;
    }

    /**
     * Use to update last query time
     */
    protected updateReportQueryTime() {
        console.log(`=>Query from  ${this.getLastReportQueryTime()}`);
        this.queryAllAsync(QueryContent.ReportsLastUpdateTime).then((resolve) => {
            if(resolve[0]["updateTime"].toString() == this.getLastReportQueryTime().toISOString()) console.log("The same, dont changed");
            this.setLastReportQueryTime(resolve[0]["updateTime"]);
            const fs = require('fs');
            fs.writeFile('./workspace/custom/modules/acs/CCURE/ReportQueryTimeSavedFile.tmp', this.getLastReportQueryTime().toISOString(), function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("=>ReportQueryTimeSavedFile.tmp file was saved!");
            });
            console.log(`=>Update 'lastUpdateTime to ${this.getLastReportQueryTime()}`);
        }).catch(err => {
            console.log(`=>Update 'lastUpdateTime fail`);
        });
    }

    /**
     * Generate query string
     * @param queryContent Query type
     * @param queryParam Query parameters
     */
    protected generateQueryString(queryContent: QueryContent, queryParam: IQueryParam, condition?: String): string {
        let queryCmd: string ;

        let innerSelect = false;
        let alreadyWhere = false;
        if(isNullOrUndefined(queryParam.inner_selector) === true) queryParam.inner_selector = '*';
        queryCmd = `select ${queryParam.selector} from openquery(${queryParam.dsn},'select ${queryParam.inner_selector} from ${queryParam.table}`;

        if(isNullOrUndefined(queryParam.left_join_table)  === false && 
            isNullOrUndefined(queryParam.left_join_on) === false)
        {
            queryCmd += ` left join ${queryParam.left_join_table} on ${queryParam.left_join_on}`;
        }

        if (isNullOrUndefined(queryParam.condition) === false && (queryParam.condition === "") === false && innerSelect === false) {
            queryCmd += ` where (${queryParam.condition})`;
            alreadyWhere = true;
        }

        if (isNullOrUndefined(condition) === false && (condition === "") === false) {
            if(condition.substr(0,6) == "inner:"){
                if(alreadyWhere === true) queryCmd += ` and (${condition.substring(6)})`;
                else queryCmd += ` where (${condition.substring(6)})`;
                innerSelect = true;
            }
        }

        if (queryContent === QueryContent.ReportsNewUpdate) {
            queryCmd += ` and PANELLOCALTZDT>''${this.getLastReportQueryTime().toISOString().replace(/T/, ' ').replace(/\..+/, '')}''`;
        }

        queryCmd += `')`;

        if (isNullOrUndefined(condition) === false && (condition === "") === false && innerSelect === false) {
            queryCmd = `select * from (${queryCmd}) temp where ${condition}`;
        }

        return queryCmd;
    }

    /**
     * Default Callbackfunction
     * @param err error message
     */
    protected defaultErrCalback(err, queryContent: QueryContent) {
        throw (`defaultErrCalback : happened\n Message: ${err}`);
    }

    /**
     * Verify ip
     * @param address ip address. e.g. "192.168.127.254"
     */
    protected verifyIP(address: string): void {
        let isThrow: boolean = false;
        let strArr: Array<string> = address.split('.');

        if (strArr.length != 4) isThrow = true;
        for (let i: number = 0; i < 4; i++) {
            var num = Number(strArr[i]);
            if (isNaN(num) || num < 0 || num > 255) {
                throw `Internal Error: <CCUREReader::verifyIP> address format error, address ip:<${address}>`;
            }
        }
    }

    /**
     * Verify port
     * @param p port number. e.g. "6131"
     */
    protected verifyPort(p: number): void {
        if (isNaN(p) || p < 0 || p >= 65535)
            throw `Internal Error: <CCUREReader::verifyPort> ip format error, port:<${p}>`;
    }
};

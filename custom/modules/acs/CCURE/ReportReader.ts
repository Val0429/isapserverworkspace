import { isNullOrUndefined, isNull } from "util";
import { toArray } from "rxjs/operator/toArray";
import { SignalObject } from "./signalObject";
import {IQueryMap, IQueryParam} from './queryMap'

export enum ReaderQueryContent {
    Reports,
    Person,
    Door
}

export var ReaderQueryMap : IQueryMap = {};
{
    //ReportsAll
    /**
     * messageCode :
     *  1002 人 - 卡 : 核可進入
     *  1003 人 - 卡 : 拒絕進入
     */
    ReaderQueryMap[ReaderQueryContent.Reports] = {
        "table": "dbo.Journ",
        "selector":  'R_Date_Time as dateTime,' +  
                     'Person_ID as personId,'+
                     'C_Number as cardNumber,'+
                     'Door_ID as doorId'
    }

    ReaderQueryMap[ReaderQueryContent.Person] = {
        "table": "dbo.Person",
        "selector":  'Person_ID as personId,'+
                     'Last_Name as name'
    }

    ReaderQueryMap[ReaderQueryContent.Door] = {
        "table": "dbo.Door",
        "selector":  'Door_ID as doorId,' +  
                     'Door_Name as name'
    }

    let keys = Object.keys(ReaderQueryContent).filter(key => !isNaN(Number(ReaderQueryContent[key])));
    for (let type in keys) {
        if (isNullOrUndefined(ReaderQueryMap[type]))
            throw `Internal Error: <ReportReader::setDefaultMap> Verify _ReaderQueryMap fail, please check {QueryContent.${ReaderQueryContent[type]}} again`;
    }
}

enum StateCode {
    Wait = 0,
    Success = 1,
    Error = 2
}

export class ReportReader {

    protected static _instance: ReportReader = undefined;

    protected _isConnected: boolean;

    protected _sql;

    protected _conn;

    protected _bacthCount = 1000;

    protected _signalRead: SignalObject = new SignalObject(false);

    protected constructor() {
        this._sql = require("mssql");
        this._conn = undefined;
        this._isConnected = false;
    }

    /**
     * Return ReportReader instance
     */
    public static getInstance(): ReportReader {
        if (isNullOrUndefined(this._instance) === true){
            this._instance = new ReportReader();
            ReportReader._instance._signalRead.set(true);
        }
        return this._instance;
    }

    /**
     * Connect
     */
    public async connectAsync(config): Promise<void> {
        if (this._isConnected) return;
        if (isNullOrUndefined(config) === true) throw `Internal Error: <ReportReader::connectAsync> config is equal null or undefined.`;
        if (config.database === "") throw `Internal Error: <ReportReader::connectAsync> config.odbcDSN cannot be empty`;
        this.verifyIP(config.server);
        this.verifyPort(config.port);

        this._conn = new this._sql.ConnectionPool(config);

        try {
            return await this._conn.connect().then(() => {
                this._isConnected = true;
                console.log(`=>Connect Successful`);
            });
        }
        catch (err) {
            this._conn = null;
            return Promise.reject(`Internal Error: <ReportReader::connectAsync> Try connect error : ${err}.`);
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
    public async queryStreamAsync(queryContent,
                                    OnDatareceived: (rows: JSON[], queryContent: ReaderQueryContent) => void,
                                    OnDone?: (result: JSON, queryContent: ReaderQueryContent) => void,
                                    OnError?: (err, queryContent: ReaderQueryContent) => void,
                                    condition?: String,
                                    isOpenquery ?: boolean): Promise<void> {

        if (this._isConnected === false) throw `Internal Error: <ReportReader::queryStream> No connection with SQL server`;
        if (isNullOrUndefined(OnDatareceived) === true) throw `Internal Error: <ReportReader::queryStream> OnDatareceived cannot be null`;

        let queryParam: IQueryParam = ReaderQueryMap[queryContent];

        let request = new this._sql.Request(this._conn);
        request.stream = true;

        queryParam.OnReceivedData = OnDatareceived;
        queryParam.OnDone = OnDone;
        queryParam.OnError = OnError;

        await this._signalRead.wait(10000);
                                
        let queryCmd = this.generateQueryString(queryContent, queryParam, condition, isNullOrUndefined(isOpenquery) ? false : isOpenquery);

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
                processRows();
            }
        });
        request.on('done', result => {
            request.pause();
            processRows();
            if (isNullOrUndefined(queryParam.OnDone) === false) 
                queryParam.OnDone(result, queryContent);
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
    public async queryAllAsync(queryContent, condition?: String, isOpenquery ?: boolean, timeout: number = 3000): Promise<Array<JSON>> {

        if (this._isConnected === false) throw `Internal Error: <ReportReader::queryStream> No connection with SQL server`;

        let queryParam: IQueryParam = ReaderQueryMap[queryContent];

        //Use to wait ( read/write after connected)
        let signal: SignalObject<StateCode> = new SignalObject<StateCode>(StateCode.Wait);

        let rowList: Array<JSON> = [];
        let errorStr: string;

        let request = new this._sql.Request(this._conn);
        request.stream = true;

        await this._signalRead.wait(10000);

        let queryCmd = this.generateQueryString(queryContent, queryParam, condition, isNullOrUndefined(isOpenquery) ? false : isOpenquery);

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
     * Generate query string
     * @param queryContent Query type
     * @param queryParam Query parameters
     */
    protected generateQueryString(queryContent: ReaderQueryContent, queryParam: IQueryParam, condition?: String, isOpenquery : boolean = false): string {
        
        let queryCmd: string ;
        let alreadyWhere = false;

        if(isOpenquery == true){
            let innerSelect = false;
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
    
            queryCmd += `')`;
    
            if (isNullOrUndefined(condition) === false && (condition === "") === false && innerSelect === false) {
                queryCmd = `select * from (${queryCmd}) temp where ${condition}`;
            }
    
            return queryCmd;
        }
        else{
            
            if(isNullOrUndefined(queryParam.selector) === true) queryParam.selector = '*';

            queryCmd = `select ${queryParam.selector} from  ${queryParam.table}`;

            if (isNullOrUndefined(queryParam.condition) === false && (queryParam.condition === "") === false) {
                queryCmd += ` where (${queryParam.condition})`;
                alreadyWhere = true;
            }

            if (isNullOrUndefined(condition) === false && (condition === "") === false) {
                if(alreadyWhere === true) queryCmd += ` and (${condition})`;
                else queryCmd += ` where (${condition})`;
            }

            return queryCmd;
        }
    }

    /**
     * Default Callbackfunction
     * @param err error message
     */
    protected defaultErrCalback(err, queryContent: ReaderQueryContent) {
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
                throw `Internal Error: <ReportReader::verifyIP> address format error, address ip:<${address}>`;
            }
        }
    }

    /**
     * Verify port
     * @param p port number. e.g. "6131"
     */
    protected verifyPort(p: number): void {
        if (isNaN(p) || p < 0 || p >= 65535)
            throw `Internal Error: <ReportReader::verifyPort> ip format error, port:<${p}>`;
    }
};
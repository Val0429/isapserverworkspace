import { isNullOrUndefined } from "util";
import { toArray } from "rxjs/operator/toArray";
import { SignalObject } from "../../services/modbus-service/signalObject";

/**
 * Use to assign linked database name, give CFSRV and Juranl linked database name on the SQL server
 */
export interface IDSNList {
    CFSRV: string;
    Jurnal: string;
}

/**
 * Connection informations
 */
export interface ICCUREConfig {
    server: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionTimeout?: number;
    requestTimeout?: number;
    pool?: {
        max: number;
        min: number;
        idleTimeoutMillis: number;
    };
}

/**
 * Use to specify query content
 */
export enum QueryContent {
    Persons,
    Users,
    Doors,
    ReportsAll,
    ReportsNewUpdate,
    ReportsLastUpdateTime,
    Clearance,
    ClearPerson,
    ClearPair,
    Timespec,
    GroupMember,
    ObjectList
}

enum StateCode {
    Wait = 0,
    Success = 1,
    Error = 2
}

interface IQueryParam {
    OnReceivedData?: Function;
    OnDone?: Function;
    OnError?: Function;
    table: string;
    selector: string;
    dsn: string;
    condition?: string;
};

interface IQueryMap {
    [key: number]: IQueryParam
}

export class CCUREReader {

    protected static _instance: CCUREReader = undefined;

    protected _config: ICCUREConfig;

    protected _dsn: IDSNList;

    protected _isConnected: boolean;

    protected _queryMap: IQueryMap;

    protected _lastQueryTime: number;

    protected _sql;

    protected _conn;

    protected constructor() {
        this._sql = require("mssql");
        this._conn = undefined;
        this._dsn = undefined;
        this._config = undefined;
        this._isConnected = false;
        this._queryMap = {};
        this._lastQueryTime = 0;
    }

    /**
     * Return CCUREReader instance
     */
    public static getInstance(): CCUREReader {
        if (isNullOrUndefined(this._instance) === true) this._instance = new CCUREReader();
        return this._instance;
    }

    /**
     * Set config when disconnected
     * @param config <ICCUREConfig> config
     * @param DSN <IDSNList> config
     */
    public async connectAsync(config: ICCUREConfig, DSN: IDSNList): Promise<void> {
        if (this._isConnected) throw `Internal Error: <CCUREReader::connectAsync> Still connecting, do not change config.`;
        if (isNullOrUndefined(config) === true) throw `Internal Error: <CCUREReader::connectAsync> config is equal null or undefined.`;
        if (config.database === "") throw `Internal Error: <CCUREReader::connectAsync> config.odbcDSN cannot be empty`;
        this.verifyIP(config.server);
        this.verifyPort(config.port);
        this._config = config;
        this._dsn = DSN;

        this._conn = new this._sql.ConnectionPool(this._config);

        try {
            return await this._conn.connect().then(() => {
                try {
                    this.setDefaultMap();
                }
                catch (e) {
                    Promise.reject(`Internal Error: <CCUREReader::connectAsync> Try setDefaultMap error : ${e}.`);
                }
                this._isConnected = true;
                console.log(`---------------Connect Successful---------------`);
            });
        }
        catch (err) {
            this._config = this._dsn = this._conn = null;
            return Promise.reject(`Internal Error: <CCUREReader::connectAsync> Try connect error : ${err}.`);
        }
    }

    /**
     * Disconnect
     */
    public async disconnectAsync(): Promise<void> {
        if (this._isConnected === false) throw `Internal Error: <CCUREReader::disconnectAsync> already disconnected.`;
        else {
            await this._conn.close().then(()=>{
                this._isConnected = false;
                console.log(`---------------Disonnect  successful---------------`);
                return Promise.resolve();
            }).catch(err=>{
                return Promise.reject();
            });
        }
    }

    /**
     * Query Data with Stream Transmitted
     * @param queryContent QueryContent => Persons, Users, Doors, or Reports
     * @param OnDatareceived void OnDatareceived(row) : callback when receive data, row => JSON string per row
     * @param OnDone void OnDone(result) : callback when finish receive, result => number of result
     * @param OnErr void OnErr(err) : callback when error happened, err => error reason
     */
    public queryStream(queryContent: QueryContent, OnDatareceived: (row) => void, OnDone: (result) => void, OnError = this.defaultErrCalback): void {

        if(this._isConnected === false) throw `Internal Error: <CCUREReader::queryStream> No connection with SQL server`;

        let queryParam: IQueryParam = this._queryMap[queryContent];

        let request = new this._sql.Request(this._conn);
        request.stream = true;
        queryParam.OnReceivedData = OnDatareceived;
        queryParam.OnDone = OnDone;
        queryParam.OnError = OnError;

        let queryCmd = this.generateQueryString(queryContent,queryParam);
        if (queryContent === QueryContent.ReportsNewUpdate) this.updateReportQueryTime();

        console.log(`---------------Send SQL command ${queryCmd}---------------`);

        try{
            request.query(queryCmd);
            request.on('row', row => queryParam.OnReceivedData(row));
            request.on('done', result => queryParam.OnDone(result));
            request.on('error', err => queryParam.OnError(err, queryCmd));
        }
        catch(err){
            throw `Internal Error: <CCUREReader::queryStream> Query fail, ${err}`;
        }
    }

    /**
     * Query Data 
     * @param queryContent QueryContent => Persons, Users, Doors, or Reports
     * @param timeout set timeout
     */
    public async queryAllAsync(queryContent: QueryContent, timeout: number = 3000): Promise<Array<JSON>> {

        if(this._isConnected === false) throw `Internal Error: <CCUREReader::queryStream> No connection with SQL server`;

        let queryParam: IQueryParam = this._queryMap[queryContent];

        //Use to wait ( read/write after connected)
        let signal: SignalObject<StateCode> = new SignalObject<StateCode>(StateCode.Wait);

        let rowList: Array<JSON> = [];
        let errorStr: string;

        let request = new this._sql.Request(this._conn);
        request.stream = true;
        
        let queryCmd = this.generateQueryString(queryContent,queryParam);

        if (queryContent === QueryContent.ReportsNewUpdate) this.updateReportQueryTime();

        console.log(`---------------Send SQL command ${queryCmd}---------------`);

        try{
            request.query(queryCmd);
            request.on('row', row => rowList.push(row));
            request.on('done', result => signal.set(StateCode.Success));
            request.on('error', err => {
                signal.set(StateCode.Error);
                this.defaultErrCalback(err, queryCmd)
            });
        }
        catch(err){
            throw `Internal Error: <CCUREReader::queryStream> Query fail, ${err}`;
        }

        let result: StateCode = await signal.wait(timeout < 1 ? null : timeout, v => (v != StateCode.Wait));

        if (result == StateCode.Success) return Promise.resolve(rowList);
        else return Promise.reject(errorStr);
    }

    /**
     * Return last query report time unix timestamp
     */
    public getLastReportQueryTime(): number {
        return this._lastQueryTime;
    }

    /**
     * Set last query report time unix timestamp
     * Please assign the value from previus time get from getLastReportQueryTime()
     * It use to avoid server restart then query duplicate data
     */
    public setLastReportQueryTime(timeVal: number): void {
        this._lastQueryTime = timeVal;
    }


    /**
     * Generate query string
     * @param queryContent Query type
     * @param queryParam Query parameters
     */
    protected generateQueryString(queryContent: QueryContent, queryParam: IQueryParam) : string{
        let queryCmd: string = `select ${queryParam.selector} from openquery(${queryParam.dsn},'select * from ${queryParam.table}`;
        if (!isNullOrUndefined(queryParam.condition) && !(queryParam.condition === "")) queryCmd += ` where ${queryParam.condition}`;
        if (queryContent === QueryContent.ReportsNewUpdate) {
            queryCmd += ` and Local_DT>${this.getLastReportQueryTime()}`;
        }
        queryCmd += `')`;
        return queryCmd;
    }

    /**
     * Use to update last query time
     */
    protected updateReportQueryTime(){
        console.log(`---------------Query from  ${this.getLastReportQueryTime()}---------------`);
        this.queryAllAsync(QueryContent.ReportsLastUpdateTime).then((resolve)=>{
            let lastUpdateTime = resolve[0]["updateTime"];
            this.setLastReportQueryTime(lastUpdateTime);
            console.log(`---------------Update 'lastUpdateTime to ${this.getLastReportQueryTime()}---------------`);
        }).catch(err =>{
            console.log(`---------------Update 'lastUpdateTime fail---------------`);
        });
    }

    /**
     * Default Callbackfunction
     * @param err error message
     */
    protected defaultErrCalback(err, cmd) {
        console.log(`---------------Send Command : ${cmd} ---------------`);
        console.log(err);
    }

    /**
     * Init default map
     */
    protected setDefaultMap() {
        //ReportsAll
        this._queryMap[QueryContent.ReportsAll] = {
            "table": "pub.journ",
            "selector": "Jnl_ID as reportId, User_PID as personId, Int_Data4 as cardNum, Int_Data1 as door, Local_DT as updateTime",
            "dsn": this._dsn.Jurnal,
            "condition": "Msg_Code = 3"
        }

        //ReportsNewUpdate
        this._queryMap[QueryContent.ReportsNewUpdate] = {
            "table": "pub.journ",
            "selector": "Jnl_ID as reportId, User_PID as personId, Int_Data4 as cardNum, Int_Data1 as door, Local_DT as updateTime",
            "dsn": this._dsn.Jurnal,
            "condition": "Msg_Code = 3"
        }

        //ReportsLastUpdateTime
        this._queryMap[QueryContent.ReportsLastUpdateTime] = {
            "table": "pub.journ",
            "selector": "MAX(Local_DT) as updateTime",
            "dsn": this._dsn.Jurnal,
            "condition": "Msg_Code = 3"
        }

        //Person
        this._queryMap[QueryContent.Persons] = {
            "table": "ccm.view_person",
            "selector": "PERSONID as personId, FIRSTNAME as firstName, MIDDLENAME as middleName, LASTNAME as lastName, CARDNUM as cardNum, LASTMODDT as updateTime",
            "dsn": this._dsn.CFSRV,
            "condition": "DELETED = 0"
        }

        //User
        this._queryMap[QueryContent.Users] = {
            "table": "ccm.view_users",
            "selector": "PERSONID as personId, USERNAME as userName, ODBCPWDLASTMODDT as updatePwdtime",
            "dsn": this._dsn.CFSRV
        }

        //Door
        this._queryMap[QueryContent.Doors] = {
            "table": "pub.door",
            "selector": "Door_ID as doorId, Door_Name as doorName, Unlock_Time as unlockTime, Shunt_Time as shuntTime",
            "dsn": this._dsn.CFSRV
        }

        //Clearance
        this._queryMap[QueryContent.Clearance] = {
            "table": "ccm.view_clearance",
            "selector": "CLEARANCEID as clearId, CLEARANCENAME as clearName",
            "dsn": this._dsn.CFSRV
        }

        //Clearance - Person
        this._queryMap[QueryContent.ClearPerson] = {
            "table": "ccm.view_clearperson",
            "selector": "CLEARANCEID as clearId, PERSONID as personId",
            "dsn": this._dsn.CFSRV
        }

        //Clearance - Door
        this._queryMap[QueryContent.ClearPair] = {
            "table": "ccm.view_clearpair",
            "selector": "CLEARID as clearId, CLEARTHRUOBJ as objectId, tIMESPECID as timespecId, OBJECTTYPE as objType",
            "dsn": this._dsn.CFSRV
        }

        //Timespec
        this._queryMap[QueryContent.Timespec] = {
            "table": "ccm.view_timespec",
            "selector": "TIMESPECID as timespecId, TIMESPECNAME as timespecName",
            "dsn": this._dsn.CFSRV
        }

        //Group_Member
        this._queryMap[QueryContent.GroupMember] = {
            "table": "pub.Group_Member",
            "selector": "Group_ID as groupId, Object_Id as objectId",
            "dsn": this._dsn.CFSRV
        }

        //Object List
        this._queryMap[QueryContent.ObjectList] = {
            "table": "ccm.view_objarchive",
            "selector": "OBJECTID as objId, NAME as objName, DELETED as isDeleted, OBJECTTYPE as objType",
            "dsn": this._dsn.CFSRV
        }

        let keys = Object.keys(QueryContent).filter(key => !isNaN(Number(QueryContent[key])));
        for (let type in keys) {
            if (isNullOrUndefined(this._queryMap[type]))
                throw `Internal Error: <CCUREReader::setDefaultMap> Verify _queryMap fail, please check {QueryContent.${QueryContent[type]}} again`;
        }
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

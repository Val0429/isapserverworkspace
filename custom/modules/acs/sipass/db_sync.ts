import { ClientRequest } from "http";
import { elementAt } from "rxjs/operator/elementAt";
import * as HttpClient from "request"
import * as SiPassDataStructure from "./siPass_define";
import { DESTRUCTION } from "dns";
import * as mssqlClient from "mssql";





export class SiPassDbService {

    protected _sql;

    protected _conn;

    constructor() {
        
        this._sql = require("mssql");
        this._conn = undefined;
        
    }

    public async DbConnect(data: SiPassDataStructure.SiPassDbConnectInfo) {
        console.log("---------------connect DB start--------");
        try {
            this._conn = new this._sql.ConnectionPool(data);
            return await this._conn.connect().then(() => {
                
                console.log(`=>Connect DB Successful`);
            });
        }
        catch (err) {
            this._conn = null;
            console.log(`Internal Error: Try connect error : ${err}.`);
            return `{"status" : "error"}`;
        }
    }

    public async QueryAuditTrail(data:SiPassDataStructure.IQueryTimeRange){

        let rowList: Array<JSON> = [];
        let request = new this._sql.Request(this._conn);
        request.stream = true;
        let queryCmd =`SELECT * FROM [asco4].[asco].[AuditTrail_${data.date}] 
            WHERE time_occurred > ${data.beginHour}${data.beginMin}${data.beginSec} 
            AND time_occurred  < ${data.endHour}${data.endMin}${data.endSec};`;


        console.log(`queryCmd = ${queryCmd}`);
        
        request.query(queryCmd);
        request.on('row', row => rowList.push(row));
        await request.on('done', result => {
            console.log(rowList);
            return JSON.stringify(rowList);});
        request.on('error', err => { return `{"status" : "error"}`});
    }

    public async DbDisconnect(data: SiPassDataStructure.SiPassDbConnectInfo) {
        await this._conn.close().then(() => {            
            console.log(`=>Disonnect  successful`);
            return Promise.resolve();
        }).catch(err => {
            return `{"status" : "error"}`;
        });
    }

}
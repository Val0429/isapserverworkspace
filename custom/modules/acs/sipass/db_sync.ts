import { ClientRequest } from "http";
import { elementAt } from "rxjs/operator/elementAt";
import * as HttpClient from "request"
import * as SiPassDataStructure from "./siPass_define";
import { DESTRUCTION } from "dns";

import * as msSQL from 'mssql';

export class SiPassDbService {

    private sqlClient: msSQL.connection;

    constructor() {

    }

    async DbConnect(data: SiPassDataStructure.SiPassDbConnectInfo) {
        console.log("---------------connect DB start--------");
        try {
            this.sqlClient = await msSQL.connect(data);
            
            console.log(`=>Connect DB Successful`);

            return `{"status" : "ok"}`;
        }
        catch (err) {
            // this.sqlClient = null;
            console.log(`Internal Error: Try connect error : ${err}.`);
            return `{"status" : "error"}`;
        }
    }

    public async QueryAuditTrail(data: SiPassDataStructure.IQueryTimeRange) {
        let record = [];

        try {
            let res = await this.sqlClient.request()
                .query("Select * From [asco4].[asco].[AuditTrail_" + data.date + "] Where time_occurred > '" + data.beginHour + data.beginMin + data.beginSec + "' and time_occurred  < '" + data.endHour + data.endMin + data.endSec + "'");

            record = res["recordset"];
        }
        catch (ex) {
            console.log(ex);
        }

        return record ;
    }

    public async DbDisconnect(data: SiPassDataStructure.SiPassDbConnectInfo) {
        await this.sqlClient.close().then(() => {
            console.log(`=>Disonnect  successful`);
            return Promise.resolve();
        }).catch(err => {
            return `{"status" : "error"}`;
        });
    }

}
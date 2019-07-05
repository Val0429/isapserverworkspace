import { Config } from 'core/config.gen';
import { Log } from 'helpers/utility';

import * as msSQL from 'mssql';

export class HumanResourceAdapter {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec

    private sqlClient = null ;

    constructor() {
        var me = this;

        // this.waitTimer = setTimeout(() => {
        //     me.doHumanResourcesSync();
        // }, 1000 * this.startDelayTime);
    }

    async connect(config) {
        Log.Info(`${this.constructor.name}`, `connect`);

        try {
            this.sqlClient = new msSQL.ConnectionPool(config);
            await this.sqlClient.connect();
        }
        catch (ex) {
            Log.Info(`${this.constructor.name}`, ex);
        }
    }

    async disconnect() {
        Log.Info(`${this.constructor.name}`, `disconnect`);

        try {
            await this.sqlClient.close();
        }
        catch (ex) {
            Log.Info(`${this.constructor.name}`, ex);
        }
    }

    async getViewChangeMemberLog(lastDate: string) {
        Log.Info(`${this.constructor.name}`, `getViewChangeMemberLog ${lastDate}`);

        let res = await this.sqlClient.request()
            .input('AddDate', msSQL.VarChar(10), lastDate)
            .query('select * from vieChangeMemberLog where AddDate >= @AddDate order by SeqNo');

        return res["recordset"];
    }

    async getViewHQMemberLog(lastDate: string) {
        Log.Info(`${this.constructor.name}`, `getViewHQMemberLog ${lastDate}`);

        let res = await this.sqlClient.request()
            .input('AddDate', msSQL.VarChar(10), lastDate)
            .query('select * from vieHQMemberLog where AddDate >= @AddDate order by SeqNo');

        return res["recordset"];
    }

    async getViewREMemberLog(lastDate: string) {
        Log.Info(`${this.constructor.name}`, `getViewREMemberLog ${lastDate}`);

        let res = await this.sqlClient.request()
            .input('AddDate', msSQL.VarChar(10), lastDate)
            .query('select * from vieREMemberLog where AddDate >= @AddDate order by SeqNo');

        return res["recordset"];
    }

    async getViewMember(empno: string[]) {
        Log.Info(`${this.constructor.name}`, `getViewMember ${empno.length}`);

        let res = [];
        if (empno.length >= 1) {
            let strEmp = "";

            empno.forEach(no => {
                strEmp += (",'" + no + "'");
            });

            res = await this.sqlClient.request()
                .query(`select * from vieMember where EmpNo in (''${strEmp}) order by CompCode, EmpNo`);
        }

        return res["recordset"];
    }

    async getViewSupporter(empno: string[]) {
        Log.Info(`${this.constructor.name}`, `getViewSupporter ${empno.length}`);

        let res = [];
        if (empno.length >= 1) {
            let strEmp = "";

            empno.forEach(no => {
                strEmp += (",'" + no + "'");
            });

            res = await this.sqlClient.request()
                .query(`select * from vieSupporter where SupporterNo in (''${strEmp}) order by CompCode, SupporterNo`);
        }

        return res["recordset"];
    }
}
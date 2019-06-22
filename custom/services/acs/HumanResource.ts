import { Config } from 'core/config.gen';
import { Log } from 'helpers/utility';

import * as msSQL from 'mssql';

export class HumanResourceService {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec

    private sqlClient: msSQL.connection;

    constructor() {
        var me = this;

        // this.waitTimer = setTimeout(() => {
        //     me.doHumanResourcesSync();
        // }, 1000 * this.startDelayTime);
    }

    async connect() {
        Log.Info(`${this.constructor.name}`, `connect`);

        let config = {
            user: Config.humanresource.user,
            password: Config.humanresource.password,
            server: Config.humanresource.server,
            port: Config.humanresource.port,
            database: Config.humanresource.database
        }

        this.sqlClient = await msSQL.connect(config);

        return this.sqlClient;
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
            .query('select * from vieChangeMemberLog where AddDate >= @AddDate order by SeqNo');

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
        Log.Info(`${this.constructor.name}`, `getViewREMemberLog ${empno.length}`);

        let res = [];
        if (empno.length >= 1) {
            let strEmp = "";

            empno.forEach(no => {
                strEmp += (",'" + no + "'");
            });

            res = await this.sqlClient.request()
                .query(`select * from vieMember where EmpNo in (''${strEmp}) order by CompCode, EmpNo`);
        }

        return res;
    }
}
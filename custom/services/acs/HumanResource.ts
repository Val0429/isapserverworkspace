import { Config } from 'core/config.gen';

import { Log } from 'helpers/utility';

import * as msSQL from 'mssql';


export class HumanResourceService {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec

    private sqlClient: msSQL.connection ;

    constructor() {
        var me = this;

        // this.siPassDevice = new SiPassAccountService();

        // this.waitTimer = setTimeout(() => {
        //     me.doHumanResourcesSync();
        // }, 1000 * this.startDelayTime);
    }

    async connect() {
        Log.Info(`${this.constructor.name}`, `connect`);

        let config = {
            user: 'sa',
            password: '5j/cj86aup6eji6j04njo4e',
            server: 'localhost\\DATAEXPRESS',
            database: 'FET_HR'
        }

        this.sqlClient = await msSQL.connect(config);

        return this.sqlClient ;
    }

    async getViewChangeMemberLog(lastNo: number) {
        Log.Info(`${this.constructor.name}`, `getViewChangeMemberLog ${lastNo}`);

        let res = await this.sqlClient.request()
            .input('SeqNo', msSQL.Int, lastNo)
            .query('select * from vieChangeMemberLog where SeqNo >= @SeqNo order by SeqNo');

        return res["recordset"];
    }

    async getViewHQMemberLog(lastDate: string) {
        Log.Info(`${this.constructor.name}`, `getViewHQMemberLog ${lastDate}`);

        let res = await this.sqlClient.request()
            .input('AddDate', msSQL.VarChar(10), lastDate)
            .query('select * from vieChangeMemberLog where SeqNo >= @SeqNo order by SeqNo');

        return res["recordset"];
    }

    async getViewREMemberLog(lastNo: number) {
        Log.Info(`${this.constructor.name}`, `getViewREMemberLog ${lastNo}`);

        let res = await this.sqlClient.request()
            .input('SeqNo', msSQL.Int, lastNo)
            .query('select * from vieREMemberLog where SeqNo >= @SeqNo order by SeqNo');

        return res["recordset"];
    }

    async getViewMember( empno: string[]) {
        Log.Info(`${this.constructor.name}`, `getViewREMemberLog ${empno.length}`);

        let res = [] ;
        if (empno.length >= 1) {
            let strEmp = "";

            empno.forEach(no => {
                strEmp += (",'" + no + "'");
            });

            res = await this.sqlClient.request()
                .query(`select * from vieMember where EmpNo in (''${strEmp}) order by CompCode, EmpNo`);
        }

        return res ;
    }
}
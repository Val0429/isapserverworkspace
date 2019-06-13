import { Config } from 'core/config.gen';

import { Log } from 'helpers/utility';

import { ScheduleActionEmail } from 'core/scheduler-loader';

import * as mongo from 'mongodb';
import * as msSQL from 'mssql';

import { SiPassAccountService } from './../modules/acs/sipass';


export class HRService {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec
    private cycleTime: number = 600; // sec

    private mongoClient: mongo.MongoClient;
    private mongoDb: mongo.Db;

    private sqlClient: msSQL.connection ;

    private siPassDevice: SiPassAccountService;
    private LastUpdate = {
        "vieChangeMemberLog": 0,
        "vieREMemberLog": 0
    }

    constructor() {
        var me = this;

        this.siPassDevice = new SiPassAccountService();

        this.waitTimer = setTimeout(() => {
            me.doHumanResourcesSync();
        }, 1000 * this.startDelayTime);
    }

    async doHumanResourcesSync() {
        Log.Info(`${this.constructor.name}`, `2.0 Timer Check`);

        var me = this;
        let now: Date = new Date();

        clearTimeout(this.waitTimer);

        if ((now.getHours() == 0) && (now.getMinutes() == 0)) {
            // 1.0 create database connection
            Log.Info(`${this.constructor.name}`, `2.1 create mongo database connection`);
            // (async () => {
            const url = `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}`;
            this.mongoClient = await mongo.MongoClient.connect(url);
            this.mongoDb = await this.mongoClient.db(Config.mongodb.collection);
            // })();

            Log.Info(`${this.constructor.name}`, `2.2 create mssql database connection`);
            const config = {
                user: 'sa',
                password: '5j/cj86aup6eji6j04njo4e',
                server: 'localhost\\DATAEXPRESS',
                database: 'FET_HR'
            }
            this.sqlClient = await msSQL.connect(config);


            // 2.0 import data
            let EmpNo: string[] = [];
            Log.Info(`${this.constructor.name}`, `2.1 clear temp/log tables`);
            this.mongoDb.collection("i_vieChangeMemberLog").deleteMany({});
            // this.mongoDb.collection("i_vieHQMemberLog").deleteMany({});
            this.mongoDb.collection("i_vieREMemberLog").deleteMany({});


            Log.Info(`${this.constructor.name}`, `2.2 import sync data`);

            // vieChangeMemberLog
            let res = await this.sqlClient.request()
                .input('SeqNo', msSQL.Int, this.LastUpdate.vieChangeMemberLog)
                .query('select * from vieChangeMemberLog where SeqNo >= @SeqNo order by SeqNo');

            // { recordsets: [ [ [Object], [Object], [Object] ] ],
            //     recordset:
            //      [ { SeqNo: 1,
            //          CompCode: '01',

            for (let idx = 0; idx < res["recordset"].length; idx++) {
                let record = res["recordset"][idx];

                // let log = new Parse.Object("i_vieChangeMemberLog");
                // await log.save(record);
                me.LastUpdate.vieChangeMemberLog = record["SeqNo"];
                EmpNo.push(record["EmpNo"]);
            };

            // vieChangeMemberLog
            res = await this.sqlClient.request()
                .input('AddDate', msSQL.VarChar(10), "2018/12/31")
                .query('select * from vieHQMemberLog where AddDate > @AddDate order by SeqNo');

            // { recordsets: [ [ [Object], [Object], [Object] ] ],
            //     recordset:
            //      [ { SeqNo: 1,
            //          CompCode: '01',

            // record not in the previous log list
            let newSeqNoList = [];
            for (let idx = 0; idx < res["recordset"].length; idx++) {
                let record = res["recordset"][idx];
                newSeqNoList.push(record["SeqNo"]);

                let log = await new Parse.Query("vieHQMemberLog").equalTo("SeqNo", record["SeqNo"]).first();

                if (log == undefined) {
                    EmpNo.push(record["EmpNo"]);
                    await new Parse.Object("vieHQMemberLog").save(record);
                }
                else {
                    if (record["AddDate"] != log.get("AddDate")) {
                        EmpNo.push(record["EmpNo"]);
                        log.set("AddDate", record["AddDate"]);
                        log.save();
                    }
                }
            };

            // record not in the new log list
            let records = await new Parse.Query("vieHQMemberLog").greaterThanOrEqualTo("AddDate", "2018/12/31").find();
            for (let idx = 0; idx < records.length; idx++) {
                let record = records[idx];

                if (newSeqNoList.indexOf(record.get("SeqNo")) < 0) {
                    EmpNo.push(record.get("EmpNo"));
                }
            }

            // vieREMemberLog
            res = await this.sqlClient.request()
                .input('SeqNo', msSQL.Int, this.LastUpdate.vieREMemberLog)
                .query('select * from vieREMemberLog where SeqNo >= @SeqNo order by SeqNo');

            // { recordsets: [ [ [Object], [Object], [Object] ] ],
            //     recordset:
            //      [ { SeqNo: 1,
            //          CompCode: '01',

            for (let idx = 0; idx < res["recordset"].length; idx++) {
                let record = res["recordset"][idx];

                me.LastUpdate.vieREMemberLog = record["SeqNo"];
                EmpNo.push(record["EmpNo"]);
            };

            // 4.0 request human information
            Log.Info(`${this.constructor.name}`, `4.0 request human information`);

            if (EmpNo.length >= 1) {
                let strEmp = "";

                EmpNo.forEach(no => {
                    strEmp += (",'" + no + "'");
                });

                res = await this.sqlClient.request()
                    .query(`select * from vieMember where EmpNo in (''${strEmp}) order by CompCode, EmpNo`);

                for (let idx = 0; idx < res["recordset"].length; idx++) {
                    let record = res["recordset"][idx];

                    let empNo = record["EmpNo"];

                    this.mongoDb.collection("vieMember").findOneAndReplace({ "EmpNo" : empNo }, record, {upsert: true})
                }
            }

            Log.Info(`${this.constructor.name}`, `2.3 request device adapter data`);


            // 5.1 write data to SiPass database
            Log.Info(`${this.constructor.name}`, `5.1 write data to SiPass database`);


            // 5.2 write data to CCure800 database
            // Log.Info(`${this.constructor.name}`, `5.2 write data to CCure800 database`);


            // 6.0 report log and send smtp 
            Log.Info(`${this.constructor.name}`, `6.0 report log and send smtp`);
            // let file = new Parse.File("snapshot.jpg", { base64: item["attachments"]}, "image/jpg" );
            // await file.save();

            let result = await new ScheduleActionEmail().do(
                {
                    to: ["tulip.lin@isapsolution.com"],
                    subject: "subject",
                    body: "body",
                    // attachments: [file]
                });


            // 7.0 Database disconnect
            this.mongoClient.close();
            this.sqlClient.close();
        }

        now = new Date();
        var s = (now.getMinutes() * 60 + now.getSeconds()) % this.cycleTime;
        Log.Info(`${this.constructor.name}`, `Timer Check wait for [ ${this.cycleTime - s} ] sec`);

        this.waitTimer = setTimeout(() => {
            this.doHumanResourcesSync();
        }, (this.cycleTime - s) * 1000);
    }
}

export default new HRService();
import { Config } from 'core/config.gen';

import { Log } from 'helpers/utility';

import { ScheduleActionEmail } from 'core/scheduler-loader';

import * as mongo from 'mongodb';
import * as msSQL from 'mssql';

import { HumanResourceService } from './acs/HumanResource';


export class HRService {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec
    private cycleTime: number = 600; // sec

    private mongoClient: mongo.MongoClient;
    private mongoDb: mongo.Db;

    private sqlClient: msSQL.connection ;

    private humanResource: HumanResourceService ;

    private LastUpdate = {
        "vieChangeMemberLog": 0,
        "vieREMemberLog": 0
    }

    constructor() {
        var me = this;

        this.humanResource = new HumanResourceService();

        this.waitTimer = setTimeout(() => {
            me.doHumanResourcesSync();
        }, 1000 * this.startDelayTime);
    }

    async doHumanResourcesSync() {
        Log.Info(`${this.constructor.name}`, `0.0 Timer Check`);

        var me = this;
        let now: Date = new Date();

        clearTimeout(this.waitTimer);

        // if ((now.getHours() == 3) && (now.getMinutes() == 0)) {  // Startup @03:00
        if (now.getMinutes() != 0) {
            // 1.0 create database connection
            Log.Info(`${this.constructor.name}`, `1.0 create mongo database connection`);
            // (async () => {
            const url = `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}`;
            this.mongoClient = await mongo.MongoClient.connect(url);
            this.mongoDb = await this.mongoClient.db(Config.mongodb.collection);
            // })();

            // 2.0 initial MSSQL Connection
            Log.Info(`${this.constructor.name}`, `2.0 initial MSSQL Connection`);
            this.humanResource.connect();
            
            // 3.0 Cleae Temp Data
            Log.Info(`${this.constructor.name}`, `3.0 Cleae Temp Data`);
            let EmpNo: string[] = [];
            Log.Info(`${this.constructor.name}`, `2.1 clear temp/log tables`);
            this.mongoDb.collection("i_vieChangeMemberLog").deleteMany({});
            this.mongoDb.collection("i_vieREMemberLog").deleteMany({});
            // this.mongoDb.collection("i_vieHQMemberLog").deleteMany({});


            // 4.0 Get Import data
            Log.Info(`${this.constructor.name}`, `4.0 Get Import data`);

            let res = await this.humanResource.getViewChangeMemberLog(this.LastUpdate.vieChangeMemberLog);
            // { recordsets: [ [ [Object], [Object], [Object] ] ],
            //     recordset:
            //      [ { SeqNo: 1,
            //          CompCode: '01',

            for (let idx = 0; idx < res["recordset"].length; idx++) {
                let record = res["recordset"][idx];
                me.LastUpdate.vieChangeMemberLog = record["SeqNo"];
                EmpNo.push(record["EmpNo"]);
            };

            // vieChangeMemberLog
            let d = new Date();
                d.setDate(d.getDate() - 90);
            
            let month = d.getMonth() < 9 ? '0' + (d.getMonth() + 1) : d.getMonth() + 1;
            let day   = d.getDate()  < 10 ? '0' + d.getDate() : d.getDate();
            let str = `${d.getFullYear()}-${month}-${day}`;
            str = "2018/12/31"

            res = await this.humanResource.getViewHQMemberLog( str );
            // { recordsets: [ [ [Object], [Object], [Object] ] ],
            //     recordset:
            //      [ { SeqNo: 1,
            //          CompCode: '01',

            // 4.2.1 record not in the previous log list
            Log.Info(`${this.constructor.name}`, `4.2.1 record not in the previous log list`);            
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

            // 4.2.2 record not in the new log list
            Log.Info(`${this.constructor.name}`, `4.2.2 record not in the new log list`);            
            let records = await new Parse.Query("vieHQMemberLog").greaterThanOrEqualTo("AddDate", str).find();
            for (let idx = 0; idx < records.length; idx++) {
                let record = records[idx];

                if (newSeqNoList.indexOf(record.get("SeqNo")) < 0) {
                    EmpNo.push(record.get("EmpNo"));
                }
            }

            // 4.3 vieREMemberLog
            res = await this.humanResource.getViewREMemberLog(this.LastUpdate.vieREMemberLog);
            // { recordsets: [ [ [Object], [Object], [Object] ] ],
            //     recordset:
            //      [ { SeqNo: 1,
            //          CompCode: '01',

            for (let idx = 0; idx < res["recordset"].length; idx++) {
                let record = res["recordset"][idx];

                me.LastUpdate.vieREMemberLog = record["SeqNo"];
                EmpNo.push(record["EmpNo"]);
            };

            // 4.4 request human information
            Log.Info(`${this.constructor.name}`, `4.4 request human information ${EmpNo.length}`);

            if (EmpNo.length >= 1) {
                res = await this.humanResource.getViewMember(EmpNo);

                for (let idx = 0; idx < res["recordset"].length; idx++) {
                    let record = res["recordset"][idx];

                    let empNo = record["EmpNo"];

                    this.mongoDb.collection("vieMember").findOneAndReplace({ "EmpNo" : empNo }, record, {upsert: true})
                }
            }

            // Log.Info(`${this.constructor.name}`, `2.3 request device adapter data`);


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
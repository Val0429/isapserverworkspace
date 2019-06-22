import { Config } from 'core/config.gen';

import { Log } from 'helpers/utility';

import { ScheduleActionEmail } from 'core/scheduler-loader';

import * as mongo from 'mongodb';
import * as msSQL from 'mssql';

import { HumanResourceService } from './acs/HumanResource';
import { SyncNotification } from './../models/access-control'
import { SiPassAdapter } from './acs/SiPass';


export class HRService {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec
    private cycleTime: number = 600; // sec

    private mongoClient: mongo.MongoClient;
    private mongoDb: mongo.Db;

    private sqlClient: msSQL.connection;

    private humanResource: HumanResourceService;

    private LastUpdate = {
        "vieChangeMemberLog": "2019/06/01",
        "vieREMemberLog": "2019/06/01"
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
            let memChange = [] ;
            let memNew = [] ;
            let memOff = [] ;


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

                memChange.push(record) ;

                me.LastUpdate.vieChangeMemberLog = record["AddDate"];
                EmpNo.push(record["EmpNo"]);
            };

            // vieChangeMemberLog
            let d = new Date();
            d.setDate(d.getDate() - 90);

            let month = d.getMonth() < 9 ? '0' + (d.getMonth() + 1) : d.getMonth() + 1;
            let day = d.getDate() < 10 ? '0' + d.getDate() : d.getDate();
            let str = `${d.getFullYear()}-${month}-${day}`;
            // str = "2018/12/31"

            res = await this.humanResource.getViewHQMemberLog(str);
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

                    if ( record.get("DataType") == "H") {
                        memNew.push(record);
                    }
                    else if ( record.get("DataType") == "Q") {
                        memOff.push(record);
                    }
                    else {
                        memChange.push(record);
                    }

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

                me.LastUpdate.vieREMemberLog = record["AddDate"];
                
                memChange.push(record);

                EmpNo.push(record["EmpNo"]);
            };

            // 4.4 request human information
            Log.Info(`${this.constructor.name}`, `4.4 request human information ${EmpNo.length}`);

            let adSiPass: SiPassAdapter = new SiPassAdapter();


            if (EmpNo.length >= 1) {
                res = await this.humanResource.getViewMember(EmpNo);

                let sessionId = "";
                {
                    Log.Info(`${this.constructor.name}`, `2.1 Initial Adapter`);
                    sessionId = await adSiPass.Login();
                }

                for (let idx = 0; idx < res["recordset"].length; idx++) {
                    let record = res["recordset"][idx];

                    let empNo = record["EmpNo"];

                    this.mongoDb.collection("vieMember").findOneAndReplace({ "EmpNo": empNo }, record, { upsert: true })

                    let a = 0;
                    let b = "";
                    if (record["EmpNo"].length == 10) {
                        a = 2000000007;
                        b = "契約商";
                    }
                    else if ((record["EmpNo"].substr(0, 1) == "5") || (record["EmpNo"].substr(0, 1) == "9")) {
                        a = 2000000009;
                        b = "約聘";
                    }
                    else {
                        a = 2000000006;
                        b = "正職";
                    }

                    if (sessionId != "") {
                        let d = {
                            // attributes: {
                            //     accessibility: boolean;
                            //     apbExclusion: boolean;
                            //     apbReEntryExclusion: boolean;
                            //     isolate: boolean;
                            //     selfAuthorize: boolean;
                            //     supervisor: boolean;
                            //     visitor: boolean;
                            //     void: boolean;
                            //     restrictedVisitor:
                            // },
                            credentials: [{
                                active: true,
                                cardNumber: "",
                                endDate: ""
                            }],
                            accessRules: [],
                            employeeNumber: record["EmpNo"],
                            firstName: record["EngName"],
                            lastName: record["EmpName"],
                            personalDetails:
                            {
                                contactDetails: {
                                    email: record["EMail"],
                                    mobileNumber: record["Cellular"],
                                    // mobileServiceProvider?: string,
                                    // mobileServiceProviderId?: string,
                                    // pagerNumber?: string,
                                    // pagerServiceProvider?: string,
                                    // pagerServiceProviderId?: string,
                                    // phoneNumber?: string,
                                    // useEmailforMessageForward?: boolean
                                },
                                dateOfBirth: record["BirthDate"],
                                userDetails: {
                                    // userName?: "",
                                    // password?: "" 
                                }
                            },
                            primaryWorkgroupId: a,
                            apbWorkgroupId: 0,
                            primaryWorkgroupName: b,
                            nonPartitionWorkGroups: [],
                            // smartCardProfileId?: "0",
                            // smartCardProfileName: string,
                            // startDate: string,
                            status: 0,
                            token: "",
                            // traceDetails: {
                            //     cardLastUsed: "",
                            //     cardNumberLastUsed: "",
                            //     lastApbLocation: "",
                            //     pointName: "",
                            //     traceCard: false
                            // },
                            // vehicle1?: ICardholderVehicle,
                            // vehicle2?: ICardholderVehicle,
                            // potrait: "",
                            primaryWorkGroupAccessRule: [],
                            nonPartitionWorkgroupAccessRules: [],
                            visitorDetails: 
                            {
                                // company: string,
                                // profile: string,
                                // reason: string,
                                // license: string,
                                // email: string,
                                // restrictedUser: string,
                                // companyCode: string,
                                // durationEntry: string,
                                // durationEquipment: string,
                                // durationEntrainmentTools: string,
                                // validityApprentice: string,
                                // validityPeriodIdCard: string,
                                // entryMonSat: boolean,
                                // entryInclSun: boolean,
                                // itEquipment: boolean,
                                // entrainmentTools: boolean,
                                // topManagement: boolean,
                                // apprentice: boolean
                            },
                            customFields: [
                                {
                                    filedName: "CustomTextBoxControl8__CF",
                                    fieldValue: "Unknown"
                                },
                                {
                                    filedName: "CustomDropdownControl1__CF",
                                    fieldValue: a
                                },
                                {
                                    filedName: "CustomTextBoxControl1__CF",
                                    fieldValue: record["EmpNo"]
                                },
                                {
                                    filedName: "CustomTextBoxControl3__CF",
                                    fieldValue: record["AddUser"]
                                },
                                {
                                    filedName: "CustomTextBoxControl6__CF",
                                    fieldValue: record["CompName"]
                                },
                                {
                                    filedName: "CustomDateControl2__CF",
                                    fieldValue: record["UpdDate"]
                                },
                                {
                                    filedName: "CustomDropdownControl2__CF_CF",
                                    fieldValue: record["Sex"]
                                },
                                {
                                    filedName: "CustomTextBoxControl5__CF_CF",
                                    fieldValue: record["MVPN"]
                                },
                                {
                                    filedName: "CustomTextBoxControl5__CF_CF_CF",
                                    fieldValue: record["DeptChiName"]
                                },
                                {
                                    filedName: "CustomTextBoxControl5__CF_CF_CF_CF",
                                    fieldValue: record["CostCenter"]
                                },
                                {
                                    filedName: "CustomTextBoxControl5__CF_CF_CF_CF_CF",
                                    fieldValue: record["LocationName"]
                                },
                                {
                                    filedName: "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF",
                                    fieldValue: record["RegionName"]
                                },
                                {
                                    filedName: "CustomDateControl1__CF_CF",
                                    fieldValue: record["BirthDate"]
                                },
                                {
                                    filedName: "CustomDateControl1__CF_CF_CF",
                                    fieldValue: record["EntDate"]
                                },
                                {
                                    filedName: "CustomDateControl1__CF",
                                    fieldValue: record["OffDate"]
                                }
                            ],
                            // fingerPrints?: [],
                            cardholderPortrait: ""
                        }

                        let holder = await adSiPass.postCardHolder(d);
                    }
                }
            }

            // 5.1 write data to SiPass database
            Log.Info(`${this.constructor.name}`, `5.1 write data to SiPass database`);


            // 5.2 write data to CCure800 database
            // Log.Info(`${this.constructor.name}`, `5.2 write data to CCure800 database`);


            // 6.0 report log and send smtp 
            Log.Info(`${this.constructor.name}`, `6.0 report log and send smtp`);
            // let file = new Parse.File("snapshot.jpg", { base64: item["attachments"]}, "image/jpg" );
            // await file.save();

            let rec = [] ;
            let list = await new Parse.Query(SyncNotification).first();

            for (let i = 0; i < list["receivers"].length; i++) {
                const e = list["receivers"][i];
                
                rec.push(e.get("emailaddress"))
            }

            var today = new Date();
            let dd = today.toISOString().substring(0, 10);

            let result = await new ScheduleActionEmail().do(
                {
                    to: rec,
                    subject: dd + " 門禁系統人事資料同步更新通知",
                    body: ""
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
import { Config } from 'core/config.gen';
import * as fs from 'fs';


import { Log } from 'helpers/utility';

import { ScheduleActionEmail } from 'core/scheduler-loader';

import * as mongo from 'mongodb';
// import * as msSQL from 'mssql';

import { HumanResourceService } from './acs/HumanResource';
import { SyncNotification } from './../models/access-control'
// import { SiPassAdapter } from './acs/SiPass';
import { ParseObject } from 'core/cgi-package';


export class HRService {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec
    private checkCycleTime: number = 600; // sec

    private mongoClient: mongo.MongoClient;
    private mongoDb: mongo.Db;

    // private sqlClient: msSQL.connection;

    private humanResource: HumanResourceService;

    private LastUpdate = null;

    constructor() {
        var me = this;

        this.humanResource = new HumanResourceService();

        this.LastUpdate = require('./hr_last_update.json');

        console.log(this.LastUpdate);

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
        if (now.getMinutes() < 70) {
            let memChange = [];
            let memNew = [];
            let memOff = [];

            // 1.0 create database connection
            Log.Info(`${this.constructor.name}`, `1.0 create mongo database connection`);
            // (async () => {
            try {
                const url = `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}`;
                this.mongoClient = await mongo.MongoClient.connect(url);
                this.mongoDb = await this.mongoClient.db(Config.mongodb.collection);
            }
            catch (ex) {
                Log.Info(`${this.constructor.name}`, ex);
            }
            // })();

            // 2.0 initial MSSQL Connection
            Log.Info(`${this.constructor.name}`, `2.0 initial MSSQL Connection`);
            let config = {
                server: Config.humanresource.server,
                port: Config.humanresource.port,
                user: Config.humanresource.user,
                password: Config.humanresource.password,
                database: Config.humanresource.database
            }

            await this.humanResource.connect(config);

            // 3.0 Cleae Temp Data
            let EmpNo: string[] = [];
            Log.Info(`${this.constructor.name}`, `3.0 Cleae Temp Data`);
            try {
                this.mongoDb.collection("i_vieChangeMemberLog").deleteMany({});
                this.mongoDb.collection("i_vieREMemberLog").deleteMany({});
                // this.mongoDb.collection("i_vieHQMemberLog").deleteMany({});
            }
            catch (ex) {
                Log.Info(`${this.constructor.name}`, ex);
            }


            // 4.0 Get Import data
            let res = null;
            Log.Info(`${this.constructor.name}`, `4.0 Get Import data`);

            Log.Info(`${this.constructor.name}`, `4.1 Get Import data getViewChangeMemberLog`);
            try {
                res = await this.humanResource.getViewChangeMemberLog(this.LastUpdate.vieChangeMemberLog);
                // recordset:
                //     [ { SeqNo: 1,
                //         CompCode: '01',

                for (let idx = 0; idx < res.length; idx++) {
                    let record = res[idx];

                    memChange.push(record);

                    me.LastUpdate.vieChangeMemberLog = record["AddDate"];
                    EmpNo.push(record["EmpNo"]);
                };
            }
            catch (ex) {
                Log.Info(`${this.constructor.name}`, ex);
            }


            // 4.2 vieChangeMemberLog
            res = null;
            Log.Info(`${this.constructor.name}`, `4.2 Get Import data getViewHQMemberLog`);

            let d = new Date();
            d.setDate(d.getDate() - 90);

            let month = d.getMonth() < 9 ? '0' + (d.getMonth() + 1) : d.getMonth() + 1;
            let day = d.getDate() < 10 ? '0' + d.getDate() : d.getDate();
            let str = `${d.getFullYear()}/${month}/${day}`;
            // str = "2018/12/31"

            Log.Info(`${this.constructor.name}`, `4.2.0 remove getViewHQMemberLog before ${str}`);
            try {
                let logs = await new Parse.Query("vieHQMemberLog").lessThan("AddDate", str).find();
                for (let i = 0; i < logs.length; i++) {
                    const e = logs[i];
                    e.destroy();
                }
            }
            catch (ex) {
                Log.Info(`${this.constructor.name}`, ex);
            }

            try {
                res = await this.humanResource.getViewHQMemberLog(str);
                // recordset:
                //     [ { SeqNo: 1,
                //         CompCode: '01',
            }
            catch (ex) {
                Log.Info(`${this.constructor.name}`, ex);
            }

            if (res != null) {
                // 4.2.1 record not in the previous log list
                Log.Info(`${this.constructor.name}`, `4.2.1 record not in the previous log list`);
                let newSeqNoList = [];
                try {
                    for (let idx = 0; idx < res.length; idx++) {
                        let record = res[idx];

                        newSeqNoList.push(record["SeqNo"]);

                        let log = await new Parse.Query("vieHQMemberLog").equalTo("SeqNo", record["SeqNo"]).first();

                        if (log == undefined) {
                            EmpNo.push(record["UserNo"]);
                            await new Parse.Object("vieHQMemberLog").save(record);
                        }
                        else {
                            if (record["AddDate"] != log.get("AddDate")) {
                                EmpNo.push(record["UserNo"]);
                                log.set("AddDate", record["AddDate"]);
                                log.save();
                            }
                        }
                    };
                }
                catch (ex) {
                    Log.Info(`${this.constructor.name}`, ex);
                }


                // 4.2.2 record not in the new log list
                Log.Info(`${this.constructor.name}`, `4.2.2 record not in the new log list`);
                try {
                    let records = await new Parse.Query("vieHQMemberLog").greaterThanOrEqualTo("AddDate", str).find();
                    for (let idx = 0; idx < records.length; idx++) {
                        let record = records[idx];

                        if (newSeqNoList.indexOf(record.get("SeqNo")) < 0) {
                            EmpNo.push(record.get("UserNo"));

                            if (record.get("DataType") == "H") {
                                memNew.push(record);
                            }
                            else if (record.get("DataType") == "Q") {
                                memOff.push(record);
                            }
                            else {
                                memChange.push(record);
                            }

                        }
                    }
                }
                catch (ex) {
                    Log.Info(`${this.constructor.name}`, ex);
                }
            }

            // 4.3 vieREMemberLog
            res = null;
            Log.Info(`${this.constructor.name}`, `4.2 Get Import data getViewREMemberLog`);
            try {
                res = await this.humanResource.getViewREMemberLog(this.LastUpdate.vieREMemberLog);
                // { recordsets: [ [ [Object], [Object], [Object] ] ],
                //     recordset:
                //      [ { SeqNo: 1,
                //          CompCode: '01',

                for (let idx = 0; idx < res.length; idx++) {
                    let record = res[idx];

                    me.LastUpdate.vieREMemberLog = record["AddDate"];
                    memChange.push(record);
                    EmpNo.push(record["UserNo"]);
                };
            }
            catch (ex) {
                Log.Info(`${this.constructor.name}`, ex);
            }

            // 4.4 request human information
            res = null;

            let newMsg = "";
            let offMsg = "";
            let chgMsg = ""; 

            Log.Info(`${this.constructor.name}`, `4.4 request human information ${EmpNo.length}`);
            if (EmpNo.length >= 1) {
                try {
                    res = await this.humanResource.getViewMember(EmpNo);
                    // let adSiPass: SiPassAdapter = new SiPassAdapter();

                    let sessionId = "";
                    // {
                    //     Log.Info(`${this.constructor.name}`, `4.4.1 Initial SiPass Adapter`);
                    //     sessionId = await adSiPass.Login();
                    // }

                    for (let idx = 0; idx < res.length; idx++) {
                        let record = res[idx];

                        let empNo = record["EmpNo"];

                        // 5.0 write data to SQL database
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

                        if ( memNew.indexOf(record["EmpNo"] >= 0)){
                             newMsg += `<tr><td>${record["EmpNo"]}</td><td>${record["EmpName"]}</td><td>${b}</td><td>${record["DeptChiName"]}</td><td>${record["EngName"]}</td></tr>`;
                        }

                        if ( memOff.indexOf(record["EmpNo"] >= 0)){
                            offMsg += `<tr><td>${record["EmpNo"]}</td><td>${record["EmpName"]}</td><td>${b}</td><td>${record["DeptChiName"]}</td><td>${record["OffDate"]}</td><td>${record["EngName"]}</td></tr>`;
                        }

                        if ( memChange.indexOf(record["EmpNo"] >= 0)){
                            let change = "";
                            let db = await this.mongoDb.collection("vieMember").findOne({ "EmpNo": empNo }) ;

                            {
                                if (record["CompCode"] != db["CompCode"] )  change += ",公司代碼:" + record["CompCode"] ;
                                if (record["CompName"] != db["CompName"] )  change += ",公司/廠商名稱:" + record["CompName"] ;
                                if (record["EngName"] != db["EngName"] )  change += ",英文姓名:" + record["EngName"] ;
                                if (record["EmpName"] != db["EmpName"] )  change += ",中文姓名:" + record["EmpName"] ;
                                if (record["Extension"] != db["Extension"] )  change += ",分機號碼:" + record["Extension"] ;
                                if (record["MVPN"] != db["MVPN"] )  change += ",MVPN:" + record["MVPN"] ;
                                if (record["Cellular"] != db["Cellular"] )  change += ",行動電話:" + record["Cellular"] ;
                                if (record["EMail"] != db["EMail"] )  change += ",EMail:" + record["EMail"] ;
                                if (record["Sex"] != db["Sex"] )  change += ",性別:" + record["Sex"] ;
                                if (record["BirthDate"] != db["BirthDate"] )  change += ",出生日期:" + record["BirthDate"] ;
                                if (record["DeptCode"] != db["DeptCode"] )  change += ",部門代號:" + record["DeptCode"] ;
                                if (record["DeptChiName"] != db["DeptChiName"] )  change += ",部門名稱:" + record["DeptChiName"] ;
                                if (record["CostCenter"] != db["CostCenter"] )  change += ",成本中心代碼:" + record["CostCenter"] ;
                                if (record["LocationCode"] != db["LocationCode"] )  change += ",地區代碼:" + record["LocationCode"] ;
                                if (record["LocationName"] != db["LocationName"] )  change += ",地區:" + record["LocationName"] ;
                                if (record["RegionCode"] != db["RegionCode"] )  change += ",區域代碼:" + record["RegionCode"] ;
                                if (record["RegionName"] != db["RegionName"] )  change += ",工作區域:" + record["RegionName"] ;
                                if (record["EntDate"] != db["EntDate"] )  change += ",報到日期:" + record["EntDate"] ;
                                if (record["OffDate"] != db["OffDate"] )  change += ",離職日期:" + record["OffDate"] ;
                            }

                            if (change.length >= 2) change = change.substr(1);

                            chgMsg += `<tr><td>${record["EmpNo"]}</td><td>${record["EmpName"]}</td><td>${b}</td><td>${record["EngName"]}</td><td>${change}</td></tr>`;
                        }

                        Log.Info(`${this.constructor.name}`, `5.0 write data to SQL database ${empNo}`);
                        this.mongoDb.collection("vieMember").findOneAndReplace({ "EmpNo": empNo }, record, { upsert: true })

                        if (sessionId != "") {
                            // 5.1 write data to SiPass database
                            Log.Info(`${this.constructor.name}`, `5.1 write data to SiPass database ${record["EmpNo"]} ${record["EngName"]} ${record["EmpName"]}`);

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

                            // let holder = await adSiPass.postCardHolder(d);
                        }
                    }
                }
                catch (ex) {
                    Log.Info(`${this.constructor.name}`, ex);
                }
            }

            // 6.0 report log and send smtp 
            let rec = [];
            Log.Info(`${this.constructor.name}`, `6.0 report log and send smtp`);
            try {
                let o = await new Parse.Query(SyncNotification).first();
                let list = ParseObject.toOutputJSON(o);

                for (let i = 0; i < list["receivers"].length; i++) {
                    const e = list["receivers"][i];

                    rec.push(e["emailaddress"]);
                }
                Log.Info(`${this.constructor.name}`, `6.1 send to ${rec}`);

                var today = new Date();
                let dd = today.toISOString().substring(0, 10);

                let msg = `Dear Sir<p>${dd}門禁系統人事資料同步更新通知<p>`;
                
                if ( memNew.length >= 1) {
                    msg += `新增人員之資料共${memNew.length}筆，詳細資料如下：<br><br>
                    <table border="0" width="600">
                    <tr><th>員工工號</th><th>姓名</th><th>人員類型</th><th>部門名稱</th><th>英文姓名</th></tr>`;
                    msg += newMsg ;
                    msg += `</table><p>`;
                }

                if ( memChange.length >= 1) {
                    msg += `異動人員之資料共${memChange.length}筆，詳細資料如下：<br><br>
                    <table border="0" width="600">
                    <tr><th>員工工號</th><th>姓名</th><th>人員類型</th><th>英文姓名 </th><th>異動項目</th></tr>`;
                    msg += chgMsg ;
                    msg += `</table><p>`;
                }

                if ( memOff.length >= 1) {
                    msg += `離職人員之資料共${memOff.length}筆，詳細資料如下：<br><br>
                    <table border="0" width="600">
                    <tr><th>員工工號</th><th>姓名</th><th>人員類型</th><th>部門名稱</th><th>離職日</th><th>英文姓名</th></tr>`;
                    msg += chgMsg ;
                    msg += `</table>`;

                }


                let result = await new ScheduleActionEmail().do(
                    {
                        to: rec,
                        subject: dd + " 門禁系統人事資料同步更新通知",
                        body: msg
                    });

            }
            catch (ex) {
                Log.Info(`${this.constructor.name}`, ex);
            }


            // 7.0 Database disconnect
            Log.Info(`${this.constructor.name}`, `7.0 Database disconnect`);
            try {
                this.mongoClient.close();
                this.humanResource.disconnect();
            }
            catch (ex) {
                Log.Info(`${this.constructor.name}`, ex);
            }
        }

        now = new Date();
        var s = (now.getMinutes() * 60 + now.getSeconds()) % this.checkCycleTime;
        Log.Info(`${this.constructor.name}`, `Timer Check wait for [ ${this.checkCycleTime - s} ] sec`);

        this.waitTimer = setTimeout(() => {
            this.doHumanResourcesSync();
        }, (this.checkCycleTime - s) * 1000);
    }
}

export default new HRService();
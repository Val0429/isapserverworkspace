import { Config } from 'core/config.gen';
import * as fs from 'fs';

import * as delay from 'delay';
import { Log } from './log';

import { ScheduleActionEmail } from 'core/scheduler-loader';

import * as mongo from 'mongodb';
import * as msSQL from 'mssql';

import { HumanResourceAdapter } from './acs/HumanResourceAdapter';
import { CCure800SqlAdapter } from './acs/CCure800SqlAdapter';
import { SyncNotification } from './../models/access-control';
import { vieMember } from '../../custom/models'

import { siPassAdapter, cCureAdapter } from './acsAdapter-Manager';
import { ParseObject, Member } from 'core/cgi-package';
import { stringify } from 'querystring';
import { mongoDBUrl } from 'helpers/mongodb/url-helper';


export class HRService {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec
    private checkCycleTime: number = 1200; // sec

    private mongoClient: mongo.MongoClient;
    private mongoDb: mongo.Db;

    private humanResource: HumanResourceAdapter;
    private CCure800SqlAdapter: CCure800SqlAdapter;

    private LastUpdate = null;

    constructor() {
        var me = this;

        this.humanResource = new HumanResourceAdapter();
        this.CCure800SqlAdapter = new CCure800SqlAdapter();

        this.LastUpdate = require('./hr_last_update.json');

        console.log("hr last update", this.LastUpdate);

        
    }
    getDate(date, splitter="T"){
        try{    
         let dt = new Date(date);
         return dt.toISOString().split(splitter)[0];
      }catch (err){
          return "";
      }
    }
    async doHumanResourcesSync(hour:number=3,minute:number=0) {
        Log.Info(`${this.constructor.name}`, `0.0 Timer Check`);

        let now: Date = new Date();

        clearTimeout(this.waitTimer);
        this.checkCycleTime = 1200;


        if ((now.getHours() == hour) && (now.getMinutes() == minute)) {  // Startup @03:00
        // if (now.getMinutes() < 70) {
            await this.doSync();
        }

        now = new Date();
        var s = (now.getMinutes() * 60 + now.getSeconds()) % this.checkCycleTime;
        Log.Info(`${this.constructor.name}`, `Timer Check wait for [ ${this.checkCycleTime - s} ] sec`);

        this.waitTimer = setTimeout(() => {
            this.doHumanResourcesSync();
        }, (this.checkCycleTime - s) * 1000);
    }

    async doSync(){
        await this.CCure800SqlAdapter.clearMember();
            let memChange = [];
            let memNew = [];
            let memOff = [];

            // let a = { OffDate : "1234/12/34T01:02:03" } ;
            // console.log( JSON.stringify(a["OffDate"]).replace(/\//g, "-"));





            // 1.0 create database connection
            Log.Info(`${this.constructor.name}`, `1.0 create mongo database connection`);
            // (async () => {
            try {
                // const url = `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}`;
                const url = mongoDBUrl();
                this.mongoClient = await mongo.MongoClient.connect(url);
                this.mongoDb = await this.mongoClient.db(Config.mongodb.collection);
            }
            catch (ex) {
                this.checkCycleTime = 5;
                Log.Info(`${this.constructor.name}`, ex);
            }
            // })();

            // 2.0 initial MSSQL Connection
            if (this.checkCycleTime != 5) {
                Log.Info(`${this.constructor.name}`, `2.0 initial MSSQL Connection`);
                let config = {
                    server: Config.humanresource.server,
                    port: Config.humanresource.port,
                    user: Config.humanresource.user,
                    password: Config.humanresource.password,
                    database: Config.humanresource.database,
                    requestTimeout: 300000,
                    connectionTimeout: 300000, //ms
                    options: {
                        tdsVersion: '7_1' //for sql server 2000
                    }
                }

                try {
                    //await this.CCure800SqlAdapter.connect(Config.ccureconnect);
                    await this.humanResource.connect(config);
                }
                catch (ex) {
                    this.checkCycleTime = 5;

                    Log.Info(`${this.constructor.name}`, ex);
                }

                // config = {
                //     server: Config.ccuresqlserver.server,
                //     port: Config.ccuresqlserver.port,
                //     user: Config.ccuresqlserver.user,
                //     password: Config.ccuresqlserver.password,
                //     database: Config.ccuresqlserver.database,
                //     requestTimeout: 300000,
                //     connectionTimeout: 300000 //ms
                // }

                // try {
                //     await this.CCure800SqlAdapter.connect(config);
                // }
                // catch (ex) {
                //     this.checkCycleTime = 5;

                //     Log.Info(`${this.constructor.name}`, ex);
                // }
            }

            // 3.0 SiPass Connection
            //let sessionId = "" ;
            // let sessionId = await siPassAdapter.sessionToken;

            // if (!sessionId) {
            //     this.checkCycleTime = 5;
            //     Log.Info(`${this.constructor.name}`, `SiPass Connect Fail`);
            // }

            // 3.0 Cleae Temp Data
            let EmpNo: string[] = [];
            await this.cleanTempData();
            // 4.0 Get Import data
            await this.getImportData(memChange, EmpNo);
            // 4.2 vieChangeMemberLog
            await this.vieChangeMemberLog(EmpNo, memNew, memOff, memChange);
            // 4.3 vieREMemberLog
            await this.vieREMemberLog(memChange, EmpNo);

            // 4.4 request human information
            if (this.checkCycleTime != 5) {               
                Log.Info(`${this.constructor.name}`, `4.4 request human information ${EmpNo.length}`);
                while(EmpNo.length>100){
                    let newEmpNo = EmpNo.splice(0,100);
                    let { newMsg, offMsg, chgMsg } = await this.requestHumanInfo(newEmpNo, memNew, memOff, memChange);
                     await this.getViewSupporter(newEmpNo);
                     await this.reportLogAndMail(memNew, newMsg, memChange, chgMsg, memOff, offMsg);
                }
                let { newMsg, offMsg, chgMsg } = await this.requestHumanInfo(EmpNo, memNew, memOff, memChange);
                await this.getViewSupporter(EmpNo);
                // 6.0 report log and send smtp 
                await this.reportLogAndMail(memNew, newMsg, memChange, chgMsg, memOff, offMsg);

            }
            


          
            // 7.0 Database disconnect
            Log.Info(`${this.constructor.name}`, `7.0 Database disconnect`);
            try {
                this.mongoClient.close();
                this.humanResource.disconnect();
                //this.CCure800SqlAdapter.disconnect();
            }
            catch (ex) {
                Log.Info(`${this.constructor.name}`, ex);
            }
    }

    private async requestHumanInfo(EmpNo: string[], memNew: any[],  memOff: any[], memChange: any[]) {
        let newMsg: string="";
        let chgMsg: string="";
        let offMsg: string="";
        if (EmpNo.length >= 1) {
            try {
                let objects = [];
                let res = await this.humanResource.getViewMember(EmpNo);
                let vieMembers = await new Parse.Query(vieMember).containedIn("EmpNo", res.map(x => x["EmpNo"])).find();
                let members = await new Parse.Query(Member).containedIn("EmployeeNumber", res.map(x => x["EmpNo"])).find();
                for (let record of res) {
                   
                    ({ newMsg, offMsg, chgMsg } = await this.impotFromViewMember(record, memNew, newMsg, memOff, offMsg, memChange, vieMembers, chgMsg, objects, members));
                      
                    //important to avoid out of memory
                    if (objects.length >= 1000) {
                        await ParseObject.saveAll(objects);
                        objects = [];
                    }
                }
                await ParseObject.saveAll(objects);
            }
            catch (ex) {
                this.checkCycleTime = 5;
                Log.Info(`${this.constructor.name}`, ex);
            }
        }
        return { newMsg, offMsg, chgMsg };
    }

    private async impotFromViewMember(record: any, memNew: any[], newMsg: string, memOff: any[], offMsg: string, memChange: any[], vieMembers: vieMember[], chgMsg: string, objects: any[], members: Member[]) {
        let empNo = record["EmpNo"];
        Log.Info(`${this.constructor.name}`, `Import data vieMember ${empNo}`);
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
        if (memNew.indexOf(record["EmpNo"] >= 0)) {
            newMsg += `<tr><td>${record["EmpNo"]}</td><td>${record["EmpName"]}</td><td>${b}</td><td>${record["DeptChiName"]}</td><td>${record["EngName"]}</td></tr>`;
        }
        if (memOff.indexOf(record["EmpNo"] >= 0)) {
            offMsg += `<tr><td>${record["EmpNo"]}</td><td>${record["EmpName"]}</td><td>${b}</td><td>${record["DeptChiName"]}</td><td>${record["OffDate"]}</td><td>${record["EngName"]}</td></tr>`;
        }
        if (memChange.indexOf(record["EmpNo"] >= 0)) {
            let change = "";
            let dbParse = vieMembers.find(x => x.get("EmpNo") == empNo);
            if (dbParse) {
                let db = ParseObject.toOutputJSON(dbParse);
                if (record["CompCode"] != db["CompCode"])
                    change += ",公司代碼:" + record["CompCode"];
                if (record["CompName"] != db["CompName"])
                    change += ",公司/廠商名稱:" + record["CompName"];
                if (record["EngName"] != db["EngName"])
                    change += ",英文姓名:" + record["EngName"];
                if (record["EmpName"] != db["EmpName"])
                    change += ",中文姓名:" + record["EmpName"];
                if (record["Extension"] != db["Extension"])
                    change += ",分機號碼:" + record["Extension"];
                if (record["MVPN"] != db["MVPN"])
                    change += ",MVPN:" + record["MVPN"];
                if (record["Cellular"] != db["Cellular"])
                    change += ",行動電話:" + record["Cellular"];
                if (record["EMail"] != db["EMail"])
                    change += ",EMail:" + record["EMail"];
                if (record["Sex"] != db["Sex"])
                    change += ",性別:" + record["Sex"];
                if (record["BirthDate"] != db["BirthDate"])
                    change += ",出生日期:" + record["BirthDate"];
                if (record["DeptCode"] != db["DeptCode"])
                    change += ",部門代號:" + record["DeptCode"];
                if (record["DeptChiName"] != db["DeptChiName"])
                    change += ",部門名稱:" + record["DeptChiName"];
                if (record["CostCenter"] != db["CostCenter"])
                    change += ",成本中心代碼:" + record["CostCenter"];
                if (record["LocationCode"] != db["LocationCode"])
                    change += ",地區代碼:" + record["LocationCode"];
                if (record["LocationName"] != db["LocationName"])
                    change += ",地區:" + record["LocationName"];
                if (record["RegionCode"] != db["RegionCode"])
                    change += ",區域代碼:" + record["RegionCode"];
                if (record["RegionName"] != db["RegionName"])
                    change += ",工作區域:" + record["RegionName"];
                if (record["EntDate"] != db["EntDate"])
                    change += ",報到日期:" + record["EntDate"];
                if (record["OffDate"] != db["OffDate"])
                    change += ",離職日期:" + record["OffDate"];
            }
            if (change.length >= 2)
                change = change.substr(1);
            chgMsg += `<tr><td>${record["EmpNo"]}</td><td>${record["EmpName"]}</td><td>${b}</td><td>${record["EngName"]}</td><td>${change}</td></tr>`;
        }
        Log.Info(`${this.constructor.name}`, `5.0 write data to SQL database ${empNo}`);
        let obj = vieMembers.find(x => x.get("EmpNo") == empNo);
        if (!obj) {
            obj = new vieMember(record);
            objects.push(obj);
        }
        else {
            obj.set("attributes", record["attributes"]);
            obj.set("credentials", record["credentials"]);
            obj.set("accessRules", record["accessRules"]);
            obj.set("employeeNumber", record["employeeNumber"]);
            obj.set("firstName", record["firstName"]);
            obj.set("lastName", record["lastName"]);
            obj.set("personalDetails", record["personalDetails"]);
            obj.set("primaryWorkgroupId", record["primaryWorkgroupId"]);
            obj.set("apbWorkgroupId", record["apbWorkgroupId"]);
            obj.set("primaryWorkgroupName", record["primaryWorkgroupName"]);
            obj.set("nonPartitionWorkGroups", record["nonPartitionWorkGroups"]);
            obj.set("status", record["status"]);
            obj.set("token", record["token"]);
            obj.set("primaryWorkGroupAccessRule", record["primaryWorkGroupAccessRule"]);
            obj.set("nonPartitionWorkgroupAccessRules", record["nonPartitionWorkgroupAccessRules"]);
            obj.set("visitorDetails", record["visitorDetails"]);
            obj.set("customFields", record["customFields"]);
            obj.set("cardholderPortrait", record["cardholderPortrait"]);
            objects.push(obj);
        }
        // this.mongoDb.collection("vieMember").findOneAndReplace({ "EmpNo": empNo }, record, { upsert: true })
        let endDate = this.getDate(record["OffDate"], ".") || "2100-12-31T23:59:59";
        let startDate = this.getDate(record["EntDate"], ".") || (new Date()).toISOString().split(".")[0];
        let credential = {
            CardNumber: record["FaxNo"] + "",
            EndDate: endDate,
            Pin: "0000",
            ProfileId: 1,
            ProfileName: "基礎",
            StartDate: startDate,
            FacilityCode: 469,
            CardTechnologyCode: 10,
            PinMode: 4,
            PinDigit: 6
        };
        
        let d = {
            AccessRules: [],
            ApbWorkgroupId: a,
            Attributes: {},
            Credentials: credential.CardNumber && credential.CardNumber != "0" && credential.CardNumber != "null" ? [credential] : [],
            EmployeeNumber: record["EmpNo"] ? record["EmpNo"] : "",
            EndDate: endDate,
            FirstName: record["EngName"] ? record["EngName"] : "_",
            GeneralInformation: "",
            LastName: record["EmpName"] ? record["EmpName"] : "_",
            NonPartitionWorkGroups: [],
            PersonalDetails: {
                Address: "",
                ContactDetails: {
                    Email: record["EMail"] ? record["EMail"] : "",
                    MobileNumber: record["Cellular"] ? record["Cellular"] : "",
                    MobileServiceProviderId: "0",
                    PagerNumber: "",
                    PagerServiceProviderId: "0",
                    PhoneNumber: ""
                },
                DateOfBirth: this.getDate(record["BirthDate"]),
                PayrollNumber: "",
                Title: "",
                UserDetails: {
                    UserName: "",
                    Password: ""
                }
            },
            Potrait: "",
            PrimaryWorkgroupId: a,
            PrimaryWorkgroupName: b,
            SmartCardProfileId: "0",
            StartDate: startDate,
            Status: 61,
            Token: "-1",
            TraceDetails: {},
            Vehicle1: {},
            Vehicle2: {},
            VisitorDetails: {
                VisitorCardStatus: 0,
                VisitorCustomValues: {}
            },
            CustomFields: [
                {
                    FiledName: "CustomDateControl4__CF",
                    FieldValue: this.getDate(record["UpdDate"])
                },
                {
                    FiledName: "CustomDropdownControl1__CF",
                    FieldValue: a+""
                },
                {
                    FiledName: "CustomTextBoxControl1__CF",
                    FieldValue: record["EmpNo"] ? record["EmpNo"] : ""
                },
                {
                    FiledName: "CustomTextBoxControl3__CF",
                    FieldValue: record["AddUser"] ? record["AddUser"] : ""
                },
                {
                    FiledName: "CustomTextBoxControl6__CF",
                    FieldValue: record["CompName"] ? record["CompName"] : ""
                },
                {
                    FiledName: "CustomDropdownControl2__CF_CF",
                    FieldValue: record["Sex"] ? (record["Sex"] =="M" ? "男" :"女"): ""
                },
                {
                    FiledName: "CustomTextBoxControl5__CF_CF",
                    FieldValue: record["MVPN"] ? record["MVPN"] : ""
                },
                {
                    FiledName: "CustomTextBoxControl5__CF_CF_CF",
                    FieldValue: record["DeptChiName"] ? record["DeptChiName"] : ""
                },
                {
                    FiledName: "CustomTextBoxControl5__CF_CF_CF_CF",
                    FieldValue: record["CostCenter"] ? record["CostCenter"] : ""
                },
                {
                    FiledName: "CustomTextBoxControl5__CF_CF_CF_CF_CF",
                    FieldValue: record["LocationName"] ? record["LocationName"] : ""
                },
                {
                    FiledName: "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF",
                    FieldValue: record["RegionName"] ? record["RegionName"] : ""
                },
                {
                    FiledName: "CustomDateControl1__CF_CF",
                    FieldValue: this.getDate(record["BirthDate"])
                },
                {
                    FiledName: "CustomDateControl1__CF_CF_CF",
                    FieldValue: this.getDate(record["EntDate"])
                },
                {
                    FiledName: "CustomDateControl1__CF",
                    FieldValue: this.getDate(record["OffDate"])
                }
            ],
            token:"-1",
            "_links": []
        };
        try{
            console.log(`save to CCure Sync SQL Member ${record["EmpNo"]} ${record["EngName"]} ${record["EmpName"]}`);
            await this.CCure800SqlAdapter.writeMember(d, d.AccessRules, d.CustomFields, "NH-Employee");
            // console.log(`======================= ${sessionId}`);
            // if (sessionId != "") {
            // 5.1 write data to SiPass database
            // console.log(JSON.stringify(d));
            Log.Info(`${this.constructor.name}`, `5.1 write data to SiPass database ${record["EmpNo"]} ${record["EngName"]} ${record["EmpName"]}`);
            //sipass requires null
            for (let field of d.CustomFields) {
                field.FieldValue = field.FieldValue || null;
            }
           
            //}
            console.log(`save to Member ${record["EmpNo"]} ${record["EngName"]} ${record["EmpName"]}`);
            delete d["_links"];
            //d["_id"] = new mongo.ObjectID().toHexString();
            //this.mongoDb.collection("Member").findOneAndReplace({ "EmployeeNumber": record["EmpNo"] }, d, { upsert: true })
            let member = members.find(x => x.get("EmployeeNumber") == record["EmpNo"]);
            if (!member) {
                delete(d.token);
                member = new Member(d);
                let holder = await siPassAdapter.postCardHolder(d);
                member.set("Token", holder["Token"] || "-1");
            }
            else {
                d.token = member.get("Token");
                if(d.Credentials && d.Credentials.length>0 && d.Credentials[0].CardNumber){
                    await siPassAdapter.putCardHolder(d);
                }                
                delete(d.token);
                member.set(d);
            }
            objects.push(member);
            
        }catch(err){
            console.log("err", JSON.stringify(err));
            console.log("err data", JSON.stringify(d));
        }
        return { newMsg, offMsg, chgMsg };
    }

    private async reportLogAndMail(memNew: any[], newMsg: string, memChange: any[], chgMsg: string, memOff: any[], offMsg:string) {
        let rec = [];
        if (this.checkCycleTime != 5) {
            Log.Info(`${this.constructor.name}`, `6.0 report log and send smtp`);
            try {
                let o = await new Parse.Query(SyncNotification).first();
                let list = ParseObject.toOutputJSON(o);
                if (list != null) {
                    for (let i = 0; i < list["receivers"].length; i++) {
                        const e = list["receivers"][i];
                        rec.push(e["emailaddress"]);
                    }
                    Log.Info(`${this.constructor.name}`, `6.1 send to ${rec}`);
                    var today = new Date();
                    let dd = today.toISOString().substring(0, 10);
                    let msg = `Dear Sir<p>${dd}門禁系統人事資料同步更新通知<p>`;
                    if (memNew.length >= 1) {
                        msg += `新增人員之資料共${memNew.length}筆，詳細資料如下：<br><br>
                    <table border="0" width="600">
                    <tr><th>員工工號</th><th>姓名</th><th>人員類型</th><th>部門名稱</th><th>英文姓名</th></tr>`;
                        msg += newMsg;
                        msg += `</table><p>`;
                    }
                    if (memChange.length >= 1) {
                        msg += `異動人員之資料共${memChange.length}筆，詳細資料如下：<br><br>
                    <table border="0" width="600">
                    <tr><th>員工工號</th><th>姓名</th><th>人員類型</th><th>英文姓名 </th><th>異動項目</th></tr>`;
                        msg += chgMsg;
                        msg += `</table><p>`;
                    }
                    if (memOff.length >= 1) {
                        msg += `離職人員之資料共${memOff.length}筆，詳細資料如下：<br><br>
                    <table border="0" width="600">
                    <tr><th>員工工號</th><th>姓名</th><th>人員類型</th><th>部門名稱</th><th>離職日</th><th>英文姓名</th></tr>`;
                        msg += chgMsg;
                        msg += `</table>`;
                    }
                    let result = await new ScheduleActionEmail().do({
                        to: rec,
                        subject: dd + " 門禁系統人事資料同步更新通知",
                        body: msg
                    });
                }
            }
            catch (ex) {
                this.checkCycleTime = 5;
                Log.Info(`${this.constructor.name}`, ex);
            }
        }
        return { newMsg, chgMsg, offMsg}
    }

    private async getViewSupporter(EmpNo: string[]) {
        {
            try {
                let res = await this.humanResource.getViewSupporter(EmpNo);
                let objects = [];
                let vieMembers = await new Parse.Query(vieMember).equalTo("EmpNo", res.map(x => x["SupporterNo"])).find();
                let members = await new Parse.Query(Member).equalTo("EmployeeNumber", res.map(x => x["SupporterNo"])).find();
                for (let record of res) {
                    let supporterNo = record["SupporterNo"];
                    Log.Info(`${this.constructor.name}`, `Import data vieSupporter ${supporterNo}`);
                    // 5.0 write data to SQL database
                    let a = 2000000007;
                    let b = "契約商";
                    Log.Info(`${this.constructor.name}`, `5.0 write data to SQL database ${supporterNo}`);
                    let obj = vieMembers.find(x => x.get("EmpNo") == supporterNo);
                    if (!obj) {
                        obj = new vieMember(record);
                        objects.push(obj);
                    }
                    else {
                        obj.set("employeeNumber", record["SupporterNo"]);
                        obj.set("firstName", "_");
                        obj.set("lastName", record["SupporterName"]);
                        obj.set("personalDetails", {
                            ContactDetails: {
                                Email: record["Email"],
                                MobileNumber: record["Cellular"]
                            },
                            DateOfBirth: this.getDate(record["BirthDate"]) || ""
                        });
                        obj.set("primaryWorkgroupId", a);
                        obj.set("apbWorkgroupId", a);
                        obj.set("primaryWorkgroupName", b);
                        obj.set("status", record["status"]);
                        obj.set("token", record["token"]);
                        obj.set("visitorDetails", {
                            VisitorCardStatus: 0,
                            VisitorCustomValues: {}
                        });
                        obj.set("customFields", record["customFields"]);
                        objects.push(obj);
                    }
                    // this.mongoDb.collection("vieMember").findOneAndReplace({ "EmpNo": empNo }, record, { upsert: true })
                    let d = {
                        AccessRules: [],
                        ApbWorkgroupId: a,
                        Attributes: {},
                        Credentials: [],
                        EmployeeNumber: record["SupporterNo"] ? record["SupporterNo"] : "",
                        EndDate: this.getDate(record["OffDate"], ".") || "2100-12-31T23:59:59",
                        FirstName: record["EngName"] ? record["EngName"] : "_",
                        GeneralInformation: "",
                        LastName: record["SupporterName"] ? record["SupporterName"] : "_",
                        NonPartitionWorkGroups: [],
                        PersonalDetails: {
                            Address: "",
                            ContactDetails: {
                                Email: record["EMail"] ? record["EMail"] : "",
                                MobileNumber: record["Cellular"] ? record["Cellular"] : "",
                                MobileServiceProviderId: "0",
                                PagerNumber: "",
                                PagerServiceProviderId: "0",
                                PhoneNumber: ""
                            },
                            DateOfBirth: this.getDate(record["BirthDate"]) || "",
                            PayrollNumber: "",
                            Title: "",
                            UserDetails: {
                                UserName: "",
                                Password: ""
                            }
                        },
                        Potrait: "",
                        PrimaryWorkgroupId: a,
                        PrimaryWorkgroupName: b,
                        SmartCardProfileId: "0",
                        StartDate: this.getDate(record["EntDate"],".") || (new Date()).toISOString().split(".")[0],
                        Status: 61,
                        Token: "-1",
                        TraceDetails: {},
                        Vehicle1: {},
                        Vehicle2: {},
                        VisitorDetails: {
                            VisitorCardStatus: 0,
                            VisitorCustomValues: {}
                        },
                        CustomFields: [
                            {
                                FiledName: "CustomDateControl4__CF",
                                FieldValue: this.getDate(record["UpdDate"]) || ""
                            },
                            {
                                FiledName: "CustomDropdownControl1__CF",
                                FieldValue: a+""
                            },
                            {
                                FiledName: "CustomTextBoxControl1__CF",
                                FieldValue: record["EmpNo"] ? record["EmpNo"] : ""
                            },
                            {
                                FiledName: "CustomTextBoxControl3__CF",
                                FieldValue: record["AddUser"] ? record["AddUser"] : ""
                            },
                            {
                                FiledName: "CustomTextBoxControl6__CF",
                                FieldValue: record["CompName"] ? record["CompName"] : ""
                            },
                            {
                                FiledName: "CustomDropdownControl2__CF_CF",
                                FieldValue: record["Sex"] ? (record["Sex"] =="M" ? "男" :"女"): ""
                            },
                            {
                                FiledName: "CustomTextBoxControl5__CF_CF",
                                FieldValue: record["MVPN"] ? record["MVPN"] : ""
                            },
                            {
                                FiledName: "CustomTextBoxControl5__CF_CF_CF",
                                FieldValue: record["DeptChiName"] ? record["DeptChiName"] : ""
                            },
                            {
                                FiledName: "CustomTextBoxControl5__CF_CF_CF_CF",
                                FieldValue: record["CostCenter"] ? record["CostCenter"] : ""
                            },
                            {
                                FiledName: "CustomTextBoxControl5__CF_CF_CF_CF_CF",
                                FieldValue: record["LocationName"] ? record["LocationName"] : ""
                            },
                            {
                                FiledName: "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF",
                                FieldValue: record["RegionName"] ? record["RegionName"] : ""
                            },
                            {
                                FiledName: "CustomDateControl1__CF_CF",
                                FieldValue: this.getDate(record["BirthDate"]) || ""
                            },
                            {
                                FiledName: "CustomDateControl1__CF_CF_CF",
                                FieldValue: this.getDate(record["EntDate"] ) || ""
                            },
                            {
                                FiledName: "CustomDateControl1__CF",
                                FieldValue: this.getDate(record["OffDate"] )
                            }
                        ],
                        token:"-1",
                        "_links": []
                    };
                    try{
                        console.log(`save to CCure Sync SQL Member ${record["SupporterNo"]} ${record["SupporterName"]}`);
                        await this.CCure800SqlAdapter.writeMember(d, d.AccessRules, d.CustomFields, "NH-Employee");                   
                    
                        // 5.1 write data to SiPass database
                        
                        Log.Info(`${this.constructor.name}`, `5.1 write data to SiPass database ${record["SupporterNo"]} ${record["SupporterName"]}`);
                        //sipass requires null
                        for(let field of d.CustomFields){
                            field.FieldValue=field.FieldValue || null;
                        }
                        
                        console.log(`save to Member ${record["SupporterNo"]} ${record["SupporterName"]}`);
                        delete d["_links"];
                        //d["_id"] = new mongo.ObjectID().toHexString();
                        //this.mongoDb.collection("Member").findOneAndReplace({ "EmployeeNumber": record["SupporterNo"] }, d, { upsert: true })
                        let member = members.find(x => x.get("EmployeeNumber") == record["SupporterNo"]);
                        if (!member) {
                            delete(d.token);
                            member = new Member(d);
                            let holder = await siPassAdapter.postCardHolder(d);
                            member.set("Token", holder["Token"] || "-1");
                        }
                        else {
                            d.token = member.get("Token");
                            if(d.Credentials && d.Credentials.length>0 && d.Credentials[0].CardNumber){
                                await siPassAdapter.putCardHolder(d);
                            }
                            delete(d.token);
                            member.set(d);
                        }
                        objects.push(member);
                        //important to avoid out of memory
                        if (objects.length >= 1000) {
                            await ParseObject.saveAll(objects);
                            objects = [];
                        }
                    }catch(err){
                        console.log("err", JSON.stringify(err));
                        console.log("err data", JSON.stringify(d));
                    }
                }
                await ParseObject.saveAll(objects);
            }
            catch (ex) {
                this.checkCycleTime = 5;
                Log.Info(`${this.constructor.name}`, ex);
            }
        }
    }

    private async cleanTempData() {
        if (this.checkCycleTime != 5) {
            Log.Info(`${this.constructor.name}`, `3.0 Cleae Temp Data`);
            try {
                await this.mongoDb.collection("i_vieChangeMemberLog").deleteMany({});
                await this.mongoDb.collection("i_vieREMemberLog").deleteMany({});
                // this.mongoDb.collection("i_vieHQMemberLog").deleteMany({});
            }
            catch (ex) {
                this.checkCycleTime = 5;
                Log.Info(`${this.constructor.name}`, ex);
            }
        }
    }

    private async getImportData(memChange: any[], EmpNo: string[]) {
        if (this.checkCycleTime != 5) {
            Log.Info(`${this.constructor.name}`, `4.0 Get Import data`);
            Log.Info(`${this.constructor.name}`, `4.1 Get Import data getViewChangeMemberLog`);
            try {
                let res = await this.humanResource.getViewChangeMemberLog(this.LastUpdate.vieChangeMemberLog);
                // recordset:
                //     [ { SeqNo: 1,
                //         CompCode: '01',
                for (let record of res) {
                    memChange.push(record);
                    this.LastUpdate.vieChangeMemberLog = record["AddDate"];
                    EmpNo.push(record["EmpNo"]);
                    Log.Info(`${this.constructor.name}`, `Import data vieChangeMemberLog ${record["EmpNo"]}`);
                    delay(100);
                }
                var fs = require('fs');
                fs.writeFile('./hr_last_update.json', this.LastUpdate, 'utf8', null);
            }
            catch (ex) {
                this.checkCycleTime = 5;
                Log.Info(`${this.constructor.name}`, ex);
            }
        }
    }

    private async vieREMemberLog( memChange: any[], EmpNo: string[]) {
        if (this.checkCycleTime != 5) {
            Log.Info(`${this.constructor.name}`, `4.2 Get Import data vieREMemberLog`);
            try {
                let res = await this.humanResource.getViewREMemberLog(this.LastUpdate.vieREMemberLog);
                // { recordsets: [ [ [Object], [Object], [Object] ] ],
                //     recordset:
                //      [ { SeqNo: 1,
                //          CompCode: '01',
                for (let record of res) {
                    this.LastUpdate.vieREMemberLog = record["AddDate"];
                    memChange.push(record);
                    EmpNo.push(record["UserNo"]);
                    Log.Info(`${this.constructor.name}`, `Import data vieREMemberLog ${record["UserNo"]}`);
                }
                var fs = require('fs');
                fs.writeFile('./hr_last_update.json', this.LastUpdate, 'utf8', null);
            }
            catch (ex) {
                this.checkCycleTime = 5;
                Log.Info(`${this.constructor.name}`, ex);
            }
        }
    }

    private async vieChangeMemberLog(EmpNo: string[], memNew: any[], memOff: any[], memChange: any[]) {
        if (this.checkCycleTime != 5) {
            Log.Info(`${this.constructor.name}`, `4.2 Get Import data vieHQMemberLog`);
            let d = new Date();
            d.setDate(d.getDate() - 90);
            let month = d.getMonth() < 9 ? '0' + (d.getMonth() + 1) : d.getMonth() + 1;
            let day = d.getDate() < 10 ? '0' + d.getDate() : d.getDate();
            let str = `${d.getFullYear()}/${month}/${day}`;
            Log.Info(`${this.constructor.name}`, `4.2.0 remove vieHQMemberLog before ${str}`);
            try {
                let logs = await new Parse.Query("vieHQMemberLog").lessThan("AddDate", str).find();
                await ParseObject.destroyAll(logs);
            }
            catch (ex) {
                this.checkCycleTime = 5;
                Log.Info(`${this.constructor.name}`, ex);
            }
            try {
                let res = await this.humanResource.getViewHQMemberLog(str);
                // recordset:
                //     [ { SeqNo: 1,
                //         CompCode: '01',
            
            
                // 4.2.1 record not in the previous log list
                Log.Info(`${this.constructor.name}`, `4.2.1 record not in the previous log list`);
                let newSeqNoList = [];
                let members = await new Parse.Query("vieHQMemberLog").containedIn("SeqNo", res.map(x => x["SeqNo"])).find();
                let objects = [];
                
                    for (let record of res) {
                        newSeqNoList.push(record["SeqNo"]);
                        let log = members.find(x => x.get("SeqNo") == record["SeqNo"]);
                        if (!log) {
                            EmpNo.push(record["UserNo"]);
                            log = new Parse.Object("vieHQMemberLog");
                            log.set(record);
                            objects.push(log);
                            Log.Info(`${this.constructor.name}`, `Import data vieHQMemberLog ${record["UserNo"]}`);
                        }
                        else {
                            if (record["AddDate"] != log.get("AddDate")) {
                                EmpNo.push(record["UserNo"]);
                                log.set("AddDate", record["AddDate"]);
                                log;
                                objects.push(log);
                                Log.Info(`${this.constructor.name}`, `Import data vieHQMemberLog ${record["UserNo"]}`);
                            }
                        }
                        //important to avoid out of memory
                        if (objects.length >= 1000) {
                            await ParseObject.saveAll(objects);
                            objects = [];
                        }
                    }
                    await ParseObject.saveAll(objects);
                
                // 4.2.2 record not in the new log list
                await this.checkRecordNotInTheNewLog(str, newSeqNoList, EmpNo, memNew, memOff, memChange);
            }
            catch (ex) {
                this.checkCycleTime = 5;
                Log.Info(`${this.constructor.name}`, ex);
            }
        }
    }

    private async checkRecordNotInTheNewLog(str: string, newSeqNoList: any[], EmpNo: string[], memNew: any[], memOff: any[], memChange: any[]) {
        Log.Info(`${this.constructor.name}`, `4.2.2 record not in the new log list`);
        try {
            let records = await new Parse.Query("vieHQMemberLog").greaterThanOrEqualTo("AddDate", str).find();
            for (let record of records) {
                if (newSeqNoList.indexOf(record.get("SeqNo")) < 0) {
                    EmpNo.push(record.get("UserNo"));
                    Log.Info(`${this.constructor.name}`, `Import data vieHQMemberLog ${record.get("UserNo")}`);
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
            this.checkCycleTime = 5;
            Log.Info(`${this.constructor.name}`, ex);
        }
    }
}

//export default new HRService();
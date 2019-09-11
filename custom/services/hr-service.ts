import { Config } from 'core/config.gen';
import * as fs from 'fs';
import * as path from 'path';
import { Log } from './log';


import * as mongo from 'mongodb';

import { HumanResourceAdapter } from './acs/HumanResourceAdapter';
import { CCure800SqlAdapter } from './acs/CCure800SqlAdapter';
import { SyncNotification, PermissionTable, ILinearMember, LinearMember } from './../models/access-control';
import { vieMember } from '../../custom/models'

import { ParseObject } from 'core/cgi-package';
import { mongoDBUrl } from 'helpers/mongodb/url-helper';
import moment = require('moment');
import MemberService, { testDate, memberFields } from './member-service';
import { ECardholderStatus } from '../modules/acs/sipass/siPass_define';


export class HRService {
    private waitTimer = null;
    private checkCycleTime: number = 1200; // sec

    private mongoClient: mongo.MongoClient;
    private mongoDb: mongo.Db;

    private humanResource: HumanResourceAdapter;
    private CCure800SqlAdapter: CCure800SqlAdapter;
    private LastUpdate = null;
    defaultPermission: string;

    constructor() {

        this.humanResource = new HumanResourceAdapter();
        this.CCure800SqlAdapter = new CCure800SqlAdapter();

        this.LastUpdate = JSON.parse(this.readFile('hr_last_update.tmp'));


        console.log("hr last update", this.LastUpdate);


    }

    readFile(filePath: string) {
        let bom = "\ufeff";
        let result = fs.readFileSync(path.join(__dirname, filePath), "utf8").toString();
        if (result.indexOf(bom) > -1) result = result.substr(bom.length);
        return result;
    }
    
    async doHumanResourcesSync(hour: number = 3, minute: number = 0) {
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

        this.waitTimer = setTimeout(async () => {
           await this.doHumanResourcesSync();
        }, (this.checkCycleTime - s) * 1000);
    }

    async doSync() {
        let o = await new Parse.Query(PermissionTable)
            .equalTo("tablename", "NH-Employee")
            .equalTo("system", 0)
            .first();
        let defaultPermission = ParseObject.toOutputJSON(o);
        this.defaultPermission = defaultPermission.objectId;
        
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
            
        }

        // 3.0 Cleae Temp Data
        let EmpNo: string[] = [];
        await this.cleanTempData();
        // 4.0 Get Import data
        await this.getVieChangeMemberLog(memChange, EmpNo);
        // 4.2 vieChangeMemberLog
        await this.getVieHQMemberLog(EmpNo, memNew, memOff, memChange);
        // 4.3 vieREMemberLog
        await this.getVieREMemberLog(memChange, EmpNo);

        // 4.4 request human information
        if (this.checkCycleTime != 5) {
            let newMsg: string = "";
            let chgMsg: string = "";
            let offMsg: string = "";
            Log.Info(`${this.constructor.name}`, `4.4 request human information ${EmpNo.length}`);
            //batch request by 100 because of lib limitation
            while (EmpNo.length > 100) {
                let newEmpNo = EmpNo.splice(0, 100);
                await this.requestHumanInfo(newEmpNo, memNew, memOff, memChange, newMsg, offMsg, chgMsg);
                await this.getViewSupporter(newEmpNo);
            }
            await this.requestHumanInfo(EmpNo, memNew, memOff, memChange, newMsg, offMsg, chgMsg);
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

    private async requestHumanInfo(EmpNo: string[], memNew: any[], memOff: any[], memChange: any[], newMsg: string, offMsg: string, chgMsg: string) {

        if (EmpNo.length <= 0) return;

        try {
            let res = await this.humanResource.getViewMember(EmpNo);
            let vieMembers = await new Parse.Query(vieMember).limit(res.length).containedIn("EmpNo", res.map(x => x["EmpNo"])).find();
            let members = await new Parse.Query(LinearMember).limit(res.length).containedIn("employeeNumber", res.map(x => x["EmpNo"])).find();
            for (let record of res) {
                await this.impotFromViewMember(record, memNew, newMsg, memOff, offMsg, memChange, vieMembers, chgMsg, members);
            }
        }
        catch (ex) {
            this.checkCycleTime = 5;
            Log.Info(`${this.constructor.name}`, ex);
        }


    }

    private async impotFromViewMember(record: any, memNew: any[], newMsg: string, memOff: any[], offMsg: string, memChange: any[], vieMembers: vieMember[], chgMsg: string, members: LinearMember[]) {
        let english = /^[A-Za-z]*$/;
        let empNo = record["EmpNo"];
        Log.Info(`${this.constructor.name}`, `Import data vieMember ${empNo}`);
        // 5.0 write data to SQL database
        let workgroupId = 0;
        let workgroupName = "";
        if (record["EmpNo"].length == 10) {
            workgroupId = 2000000006;
            workgroupName = "契約商";
        }
        else if ((record["EmpNo"].substr(0, 1) == "5") || (record["EmpNo"].substr(0, 1) == "9")
            || (english.test(record["EmpNo"]))) {
            workgroupId = 2000000008;
            workgroupName = "約聘";
        }
        else if ((record["EmpNo"].substr(0, 1) == "2") || (record["EmpNo"].substr(0, 1) == "6")
            || (record["EmpNo"].substr(0, 1) == "7") || (record["EmpNo"].substr(0, 1) == "8")) {
            workgroupId = 2000000005;
            workgroupName = "正職";
        }
        else {
            workgroupId = 1;
            workgroupName = "<無>";
        }
        if (memNew.indexOf(record["EmpNo"] >= 0)) {
            //DeptChiName value is from vieDept deptMark2
            newMsg += `<tr><td>${record["EmpNo"]}</td><td>${record["EmpName"]}</td><td>${workgroupName}</td><td>${record["DeptChiName"]}</td><td>${record["EngName"]}</td></tr>`;
        }
        if (memOff.indexOf(record["EmpNo"] >= 0)) {
            //DeptChiName value is from vieDept deptMark2
            offMsg += `<tr><td>${record["EmpNo"]}</td><td>${record["EmpName"]}</td><td>${workgroupName}</td><td>${record["DeptChiName"]}</td><td>${record["OffDate"]}</td><td>${record["EngName"]}</td></tr>`;
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
                    change += ",部門名稱:" + record["DeptChiName"]; //value is from vieDept deptMark2
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
            chgMsg += `<tr><td>${record["EmpNo"]}</td><td>${record["EmpName"]}</td><td>${workgroupName}</td><td>${record["EngName"]}</td><td>${change}</td></tr>`;
        }
        Log.Info(`${this.constructor.name}`, `5.0 write data to SQL database ${empNo}`);
        let obj = vieMembers.find(x => x.get("EmpNo") == empNo);
        if (!obj) {
            obj = new vieMember(record);
            await obj.save();
            vieMembers.push(obj);
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
            await obj.save();
        }


        let member = members.find(x => x.get("employeeNumber") == record["EmpNo"]);        
        let endDate = testDate(record["OffDate"]) || moment("2100-12-31T23:59:59+08:00").format();
        let startDate = testDate(record["EntDate"]) || moment().format();
        let newMember:ILinearMember = {
            permissionTable: [this.defaultPermission as any],
            primaryWorkgroupId:workgroupId,            
            employeeNumber: empNo,
            endDate,
            englishName: record["EngName"] || "",            
            chineseName: record["EmpName"] || "",
            email: record["EMail"] || "",
            extensionNumber: record["Cellular"] || "",
            phone: record["Extension"] || "",            
            birthday: testDate(record["BirthDate"], "T")|| "",
            startDate,
            status: ECardholderStatus.Void,
            token: "",
            lastEditTime: testDate(record["UpdDate"]),
            lastEditPerson: record["AddUser"] || "",
            companyName: record["CompName"] || "",
            gender: record["Sex"] ? (record["Sex"] == "M" ? "男" : "女") : "",
            MVPN:record["MVPN"] || "",
            department: record["DeptChiName"] || "", //value is from vieDept deptMark2
            costCenter:record["CostCenter"] || "",
            workArea: record["LocationName"] || "",
            registrationDate: testDate(record["EntDate"]),
            resignationDate: testDate(record["OffDate"])
        }
        if(member){
            let memberJson:any = ParseObject.toOutputJSON(member);            
            for(let field of memberFields){
                if(field == "permissionTable") continue;
                //reserve existing data
                newMember[field] = newMember[field] || memberJson[field];
            }
            newMember.permissionTable = memberJson.permissionTable.map(x=>x.objectId);
            newMember.cardholderPortrait = memberJson.cardholderPortrait;
        }
        try {                        
            Log.Info(`${this.constructor.name}`,`Save to Member ${record["EmpNo"]} ${record["EngName"]} ${record["EmpName"]}`);
            let memberService = new MemberService();
            if(!newMember.objectId){
                let res =  await memberService.createMember(newMember, "SYSTEM", false);
                await Log.Info(`create`, `${res.get("employeeNumber")} ${res.get("chineseName")}`, undefined, false, "Member");
            }else{
                let res = await memberService.updateMember(newMember, "SYSTEM", false);
                await Log.Info(`update`, `${res.get("employeeNumber")} ${res.get("chineseName")}`, undefined, false, "Member");
            }
            

        } catch (err) {
            console.log("err", JSON.stringify(err));
            console.log("err data", JSON.stringify(newMember));
        }
        return { newMsg, offMsg, chgMsg };
    }

    private async reportLogAndMail(memNew: any[], newMsg: string, memChange: any[], chgMsg: string, memOff: any[], offMsg: string) {
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
                    if (memNew.length >= 1) {
                    }
                    if (memChange.length >= 1) {
                    }
                    if (memOff.length >= 1) {
                    }
                }
            }
            catch (ex) {
                this.checkCycleTime = 5;
                Log.Info(`${this.constructor.name}`, ex);
            }
        }
        return { newMsg, chgMsg, offMsg }
    }

    private async getViewSupporter(EmpNo: string[]) {
        {
            if (EmpNo.length <= 0) return;
            try {
                let res = await this.humanResource.getViewSupporter(EmpNo);                
                let vieMembers = await new Parse.Query(vieMember).equalTo("EmpNo", res.map(x => x["SupporterNo"])).find();
                let members = await new Parse.Query(LinearMember).equalTo("employeeNumber", res.map(x => x["SupporterNo"])).find();
                for (let record of res) {
                    let supporterNo = record["SupporterNo"];
                    Log.Info(`${this.constructor.name}`, `Import data vieSupporter ${supporterNo}`);
                    // 5.0 write data to SQL database
                    let workgroupId = 2000000007;
                    let workgroupName = "契約商";
                    
                    let obj = vieMembers.find(x => x.get("EmpNo") == supporterNo);
                    if (!obj) {
                        obj = new vieMember(record);
                        vieMembers.push(obj);
                        await obj.save();
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
                            DateOfBirth: testDate(record["BirthDate"], "T")
                        });
                        obj.set("primaryWorkgroupId", workgroupId);
                        obj.set("apbWorkgroupId", workgroupId);
                        obj.set("primaryWorkgroupName", workgroupName);
                        obj.set("status", record["status"]);
                        obj.set("token", record["token"]);
                        obj.set("visitorDetails", {
                            VisitorCardStatus: 0,
                            VisitorCustomValues: {}
                        });
                        obj.set("customFields", record["customFields"]);
                        await obj.save();
                    }

                    let member = members.find(x => x.get("employeeNumber") == supporterNo);
                    
                    let endDate = testDate(record["OffDate"]) || moment("2100-12-31T23:59:59+08:00").format();
                    let startDate = testDate(record["EntDate"]) || moment().format();
                    
                    let newMember:ILinearMember = {
                        permissionTable:[],
                        primaryWorkgroupId: workgroupId,                        
                        employeeNumber: record["SupporterNo"] || "",
                        endDate,
                        englishName: record["EngName"] || "",                        
                        chineseName: record["SupporterName"] || "",
                        email: record["EMail"] || "",
                        extensionNumber: record["Cellular"] || "",
                        birthday: testDate(record["BirthDate"], "T")||"",                        
                        primaryWorkgroupName: workgroupName,                        
                        startDate,
                        status: ECardholderStatus.Void,
                        lastEditTime: testDate(record["UpdDate"])||"",
                        cardType: workgroupId + "",
                        allCardNumber: record["EmpNo"] || "",
                        lastEditPerson: record["AddUser"] || "",
                        companyName: record["CompName"] || "",
                        gender: record["Sex"] ? (record["Sex"] == "M" ? "男" : "女") : "",
                        MVPN: record["MVPN"] || "",
                        department: record["DeptChiName"] || "",
                        costCenter: record["CostCenter"] || "",
                        area: record["LocationName"] || "",
                        workArea: record["RegionName"] || "",
                        registrationDate: testDate(record["EntDate"])||"",
                        resignationDate: testDate(record["OffDate"])||""
                    }
                    if(member){
                        let memberJson:any = ParseObject.toOutputJSON(member);            
                        for(let field of memberFields){
                            if(field == "permissionTable") continue;
                            //reserve existing data
                            newMember[field] = newMember[field] || memberJson[field];
                        }
                        newMember.permissionTable = memberJson.permissionTable.map(x=>x.objectId);
                        newMember.cardholderPortrait = memberJson.cardholderPortrait;
                    }
                    try {                        
                        Log.Info(`${this.constructor.name}`,`Save to Member ${record["EmpNo"]} ${record["EngName"]} ${record["EmpName"]}`);
                        let memberService = new MemberService();
                        if(!newMember.objectId){
                            let res =  await memberService.createMember(newMember, "SYSTEM", false);
                            await Log.Info(`create`, `${res.get("employeeNumber")} ${res.get("chineseName")}`, undefined, false, "Member");
                        }else{
                            let res = await memberService.updateMember(newMember, "SYSTEM", false);
                            await Log.Info(`update`, `${res.get("employeeNumber")} ${res.get("chineseName")}`, undefined, false, "Member");
                        }
                        
            
                    } catch (err) {
                        console.log("err", JSON.stringify(err));
                        console.log("err data", JSON.stringify(newMember));
                    }
                }
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

    private async getVieChangeMemberLog(memChange: any[], EmpNo: string[]) {
        if (this.checkCycleTime != 5) {
            let effectDate = moment(new Date()).format("YYYY/MM/DD");
            Log.Info(`${this.constructor.name}`, `4.0 Get Import data`);
            Log.Info(`${this.constructor.name}`, `4.1 Get Import data getViewChangeMemberLog`);
            Log.Info(`${this.constructor.name}`, `Effect date ${effectDate}`);
            try {
                let savedLastDate = new Date(this.LastUpdate.vieChangeMemberLog);
                let res = await this.humanResource.getViewChangeMemberLog(savedLastDate, effectDate);
                console.log("getVieChangeMember result", res.length);
                // recordset:
                //     [ { SeqNo: 1,
                //         CompCode: '01',
                for (let record of res) {
                    //console.log("record effectDate", record["EffectDate"], effectDate);
                    if (record["EffectDate"] > effectDate) continue;
                    let lastUpdate = moment(record["AddDate"] + " " + record["AddTime"], "YYYY/MM/DD HH:mm:ss").toDate();
                    //console.log("lastUpdate",lastUpdate);
                    memChange.push(record);
                    this.LastUpdate.vieChangeMemberLog = lastUpdate > savedLastDate ? lastUpdate.toISOString() : savedLastDate.toISOString();
                    EmpNo.push(record["EmpNo"]);
                    Log.Info(`${this.constructor.name}`, `Import data vieChangeMemberLog ${record["EmpNo"]}`);

                }
                var fs = require('fs');
                fs.writeFile(__dirname + '\\hr_last_update.tmp', JSON.stringify(this.LastUpdate), 'utf8', null);
            }
            catch (ex) {
                this.checkCycleTime = 5;
                Log.Info(`${this.constructor.name}`, ex);
            }
        }
    }

    private async getVieREMemberLog(memChange: any[], EmpNo: string[]) {
        if (this.checkCycleTime != 5) {
            Log.Info(`${this.constructor.name}`, `4.2 Get Import data vieREMemberLog`);
            try {
                let effectDate = moment(new Date()).format("YYYY/MM/DD");
                let savedLastDate = new Date(this.LastUpdate.vieREMemberLog);
                let res = await this.humanResource.getViewREMemberLog(savedLastDate, effectDate);
                console.log("getVieMemberLog result", res.length);
                // { recordsets: [ [ [Object], [Object], [Object] ] ],
                //     recordset:
                //      [ { SeqNo: 1,
                //          CompCode: '01',

                for (let record of res) {
                    //console.log("record effectDate", record["EffectDate"], effectDate);
                    if (record["EffectDate"] > effectDate) continue;
                    let lastUpdate = moment(record["AddDate"] + " " + record["AddTime"], "YYYY/MM/DD HH:mm:ss").toDate();
                    //console.log("lastUpdate",lastUpdate);
                    this.LastUpdate.vieREMemberLog = lastUpdate > savedLastDate ? lastUpdate.toISOString() : savedLastDate.toISOString();
                    memChange.push(record);
                    EmpNo.push(record["UserNo"]);
                    Log.Info(`${this.constructor.name}`, `Import data vieREMemberLog ${record["UserNo"]}`);
                }
                var fs = require('fs');
                fs.writeFile(__dirname + '\\hr_last_update.tmp', JSON.stringify(this.LastUpdate), 'utf8', null);
            }
            catch (ex) {
                this.checkCycleTime = 5;
                Log.Info(`${this.constructor.name}`, ex);
            }
        }
    }

    private async getVieHQMemberLog(EmpNo: string[], memNew: any[], memOff: any[], memChange: any[]) {
        if (this.checkCycleTime != 5) {
            try {
                Log.Info(`${this.constructor.name}`, `4.2 Get Import data vieHQMemberLog`);
                let effectDate = moment(new Date()).format("YYYY/MM/DD");
                let savedLastDate = new Date(this.LastUpdate.vieHQMemberLog);
                let res = await this.humanResource.getViewHQMemberLog(savedLastDate, effectDate);
                console.log("getVieHq result", res.length);

                for (let record of res) {
                    //console.log("record effectDate", record["EffectDate"], effectDate);        
                    if (record["EffectDate"] > effectDate) continue;
                    let lastUpdate = moment(record["AddDate"] + " " + record["AddTime"], "YYYY/MM/DD HH:mm:ss").toDate();
                    //console.log("lastUpdate",lastUpdate);
                    this.LastUpdate.vieHQMemberLog = lastUpdate > savedLastDate ? lastUpdate.toISOString() : savedLastDate.toISOString();

                    if (record["DataType"] == "H") {
                        memNew.push(record);
                    }
                    else if (record["DataType"] == "Q") {
                        memOff.push(record);
                    }
                    else {
                        memChange.push(record);
                    }
                    EmpNo.push(record["UserNo"]);
                    Log.Info(`${this.constructor.name}`, `Import data vieHQMemberLog ${record["UserNo"]}`);
                }
                var fs = require('fs');
                fs.writeFile(__dirname + '\\hr_last_update.tmp', JSON.stringify(this.LastUpdate), 'utf8', null);

            }
            catch (ex) {
                this.checkCycleTime = 5;
                Log.Info(`${this.constructor.name}`, ex);
            }
        }
    }


}

//export default new HRService();
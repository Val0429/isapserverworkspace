import { Config } from 'core/config.gen';

import * as delay from 'delay';
import { Log } from 'helpers/utility';

import * as siPassClient from '../../modules/acs/sipass';
// import { ConstructSignatureDeclaration } from 'ts-simple-ast';

export class SiPassAdapter {
    // SiPass
    private siPassHrParam: siPassClient.SiPassHrApiGlobalParameter;
    private siPassDbConnectInfo: siPassClient.SiPassDbConnectInfo;

    private siPassAccount: siPassClient.SiPassHrAccountService;
    private siPassDevice: siPassClient.SiPassDeviceService;
    private siPassPersion: siPassClient.SiPassPersonService;
    private siPassPermission: siPassClient.SiPassPermissionService;
    private siPassTimeScheule: siPassClient.SiPassTimeScheuleService;
    private siPassDbService: siPassClient.SiPassDbService;

    //private checkConnectionTimer = null;
    //public sessionToken = "";

    // private isInitialed = false;

    constructor() {
        //var me = this;

        this.siPassHrParam = new siPassClient.SiPassHrApiGlobalParameter({
            "userName": Config.sipassconnect.user,
            "password": Config.sipassconnect.password,
            "uniqueId": Config.sipassconnect.uniqueId,
            "domain": Config.sipassconnect.server,
            "port": `${Config.sipassconnect.port}`,
            "sessionId": Config.sipassconnect.sessionId
        });

        this.siPassAccount = new siPassClient.SiPassHrAccountService(this.siPassHrParam);
        this.siPassDevice = new siPassClient.SiPassDeviceService();
        this.siPassPersion = new siPassClient.SiPassPersonService();
        this.siPassPermission = new siPassClient.SiPassPermissionService();
        this.siPassTimeScheule = new siPassClient.SiPassTimeScheuleService();
        this.siPassDbService = new siPassClient.SiPassDbService();


        this.siPassDbConnectInfo = new siPassClient.SiPassDbConnectInfo({
            "server": "sipasssrv",
            "port": 1433,
            "user": "manager",
            "password": "manager",
            "database": "asco4",
            "connectionTimeout": 15000
        });

        // (async () => {
        //     this.sessionToken = await this.Login();
        //     Log.Info(`${this.constructor.name}`, `sessionToken=[${this.sessionToken}}]`);
        // })();

        // if (!this.sessionToken)
        //     this.enableReconnect();
    }

    // async enableReconnect() {
    //     let me = this;

    //     this.checkConnectionTimer = setInterval(async () => {
    //         if (!this.sessionToken) {
    //             me.siPassAccount = new siPassClient.SiPassHrAccountService(me.siPassHrParam);
    //             me.sessionToken = await me.Login();
    //         }
    //     }, 5000);
    // }
    async getRecords(date: string, bH: string, bM: string, bS: string, eH: string, eM: string, eS: string) {

        await this.siPassDbService.DbConnect(this.siPassDbConnectInfo);

        let rowlist = await this.siPassDbService.QueryAuditTrail({ date: date, beginHour: bH, beginMin: bM, beginSec: bS, endHour: eH, endMin: eM, endSec: eS });

        // await this.siPassDbService.DbDisconnect(this.siPassDbConnectInfo);

        return rowlist;
    }

    private async Login() {
        Log.Info(`${this.constructor.name}`, `Login`);

        let a = await this.siPassAccount.Login(this.siPassHrParam);
        // console.log("===================    Get Login   ========== ");
        // console.log(a);
        // {
        //     "Token":"4697C6FB68DD4592E0FC49FFF9B684B56C98E8CA2AC4F94F85F9473BEA3A7C1D:siemens"
        // }
        let ret = JSON.parse(a);
        let token = ret.Token;
        //force logout after 5 seconds
        setTimeout(async()=>{            
            await this.siPassAccount.Logout(this.siPassHrParam, token);
        }, 5000);
        return token;
    }

    async getTimeSchedule() {
        Log.Info(`${this.constructor.name}`, `getTimeSchedule`);
        let token = await this.Login();
        let a = await this.siPassTimeScheule.GetTimeScheules(this.siPassHrParam, token);
        // console.log(a);
        // [{
        //     "Name":"08:00-18:00",
        //     "Token":"4"
        // },{
        //     "Name":"系統功能（非忙碌間隔）",
        //     "Token":"3"
        // },{
        //     "Name":"從不（點總是設防）",
        //     "Token":"2"            
        // },{
        //     "Name":"總是（點撤防）",
        //     "Token":"1"
        // }]
        return JSON.parse(a);
    }

    async getReaders() {
        Log.Info(`${this.constructor.name}`, `getReaders`);
        let token = await this.Login();
        let a = await this.siPassDevice.GetAllDevices(this.siPassHrParam, token);
        // console.log(a);
        // {
        //     "Records":[{
        //             "Name":"NH220_04F_01_R1_04G001_IN",
        //             "Token":"12"
        //         },{
        //             "Name":"NH220_04F_01_R1_04G001_OUT",
        //             "Token":"13"}
        //         }
        //     ],
        //     "TotalRecords":-1,
        //     "TotalDisplayRecords":-1
        // }
        return JSON.parse(a)["Records"];
    }

    async getDoors() {
        Log.Info(`${this.constructor.name}`, `getDoors`);
        let token = await this.Login();
        let a = await this.siPassDevice.GetAllDoors(this.siPassHrParam, token);
        // console.log(a);
        // {
        //     "Records":[{
        //             "Name":"N1_NH220_S_04G001",
        //             "Token":"2"
        //         },{
        //             "Name":"N1_NH220_S_04G002",
        //             "Token":"3"
        //         }
        //     ]
        // }
        return JSON.parse(a)["Records"];
    }

    async getFloors() {
        Log.Info(`${this.constructor.name}`, `getFloors`);
        let token = await this.Login();
        let a = await this.siPassDevice.GetAllFloors(this.siPassHrParam, token);
        // console.log("===================    Get GetAllFloors   ========== ");
        // console.log(a);
        return JSON.parse(a)["Records"];
    }

    async getElevators() {
        Log.Info(`${this.constructor.name}`, `getElevators`);
        let token = await this.Login();
        let a = await this.siPassDevice.GetAllElevators(this.siPassHrParam, token);
        // console.log("===================    Get GetAllElevators   ========== ");
        // console.log(a);
        return JSON.parse(a)["Records"];
    }

    async getAccessGroupList() {
        Log.Info(`${this.constructor.name}`, `getAccessGroupList`);
        let token = await this.Login();
        let a = await this.siPassPermission.GetAllPermissionTables(this.siPassHrParam, token);
        // console.log(a);
        // {
        //     "Records":[{
        //             "Name":"1樓",
        //             "Token":"1",
        //             "_links":[]
        //         },{
        //             "Name":"2樓",
        //             "Token":"2",
        //             "_links":[]
        //         }
        //     ]
        // }
        return JSON.parse(a)["Records"];
    }

    async getAccessGroup(groupToken: string) {
        Log.Info(`${this.constructor.name}`, `getAccessGroup ${groupToken}`);
        let token = await this.Login();
        let a = await this.siPassPermission.GetPermissionTable(this.siPassHrParam, { token: groupToken }, token);
        // console.log(a);
        // {
        //     "Name":"1樓",
        //     "Token":"1",
        //     "AccessLevels":[{
        //         "Name":"大門",
        //         "Token":"1",
        //         "_links":[]
        //     }]
        // }

        return JSON.parse(a);
    }

    async postAccessGroup(accessGroup: siPassClient.IAccessGroupObject) {
        Log.Info(`${this.constructor.name}`, `postAccessGroup ${accessGroup}`);
        let token = await this.Login();
        let a = await this.siPassPermission.CreatePermissionTable(this.siPassHrParam, accessGroup, token);

        return JSON.parse(a);
    }

    async putAccessGroup(accessGroup: siPassClient.IAccessGroupObject) {
        Log.Info(`${this.constructor.name}`, `putAccessGroup ${accessGroup}`);
        let token = await this.Login();
        let a = await this.siPassPermission.UpdatePermissionTable(this.siPassHrParam, accessGroup, token);

        return JSON.parse(a);
    }

    async getAccessLevel(accessToken: string) {
        Log.Info(`${this.constructor.name}`, `getAccessLevel ${accessToken}`);
        let token = await this.Login();
        let a = await this.siPassPermission.GetPermission(this.siPassHrParam, { token: accessToken }, token);
        // console.log(a);
        // {
        //     "Name":"大門",
        //     "Token":"1",
        //     "TimeScheduleToken":"4",
        //     "AccessRule":[{
        //             "ObjectToken": "12",
        //             "ObjectName":"NH220_04F_01_R1_04G001_IN",
        //             "RuleToken":"12",
        //             "RuleType":2,
        //             "StartDate":null,
        //             "EndDate":null,
        //             "ArmingRightsId":null,
        //             "ControlModeId":null
        //         },
        //         {
        //             "ObjectToken":"13",
        //             "ObjectName":"NH220_04F_01_R1_04G001_OUT",
        //             "RuleToken":"13",
        //             "RuleType":2,
        //             "StartDate":null,
        //             "EndDate":null,
        //             "ArmingRightsId":null,
        //             "ControlModeId":null
        //         }
        //     ]
        //     ,"_links":[]
        // }
        return JSON.parse(a);

        // let timeschedules = await this.getTimeSchedule();
        // let readers = await this.getReaders();

        // let tsid = "";
        // for (let j = 0; j < timeschedules.length; j++) {
        //     if (timeschedules[j].token == level["TimeScheduleToken"]) {
        //         tsid = timeschedules[j].objectId;
        //         break;
        //     }
        // }
        // // console.log("========================");
        // // console.log(tsid);

        // let rs = [];
        // for (let j = 0; j < level["AccessRule"].length; j++) {
        //     let rule = level["AccessRule"][j];
        //     for (let k = 0; k < readers.length; k++) {
        //         if (readers[k].token == rule["ObjectToken"]) {
        //             rs.push(readers[k].objectId);
        //             break;
        //         }
        //     }
        // };
        // // console.log("========================");
        // // console.log(rs);

        // let da = {
        //     levelid: level["Token"],
        //     levelname: level["Name"],
        //     status: 1,
        //     reader: rs,
        //     timeschedule: tsid
        // };
        // // console.log(da);

        // await this.mongoDb.collection("PermissionTable").findOneAndDelete({ "levelname": level["Name"] });
        // let o = new PermissionTable(da);
        // let ret = await o.save();

        // return ParseObject.toOutputJSON(ret) ;
    }

    async postAccessLevel(accessLevel: siPassClient.IAccessLevelObject) {
        Log.Info(`${this.constructor.name}`, `postAccessGroup ${accessLevel}`);
        let token = await this.Login();
        let a = await this.siPassPermission.CreatePermission(this.siPassHrParam, accessLevel, token);

        return JSON.parse(a);
    }

    async putAccessLevel(accessLevel: siPassClient.IAccessLevelObject) {
        Log.Info(`${this.constructor.name}`, `putAccessLevel ${accessLevel}`);
        let token = await this.Login();
        let a = await this.siPassPermission.UpdatePermission(this.siPassHrParam, accessLevel, token);

        return JSON.parse(a);
    }

    async getWorkGroupList() {
        Log.Info(`${this.constructor.name}`, `getWorkGroupList`);
        let token = await this.Login();
        let a = await this.siPassPermission.GetAllWorkGroup(this.siPassHrParam, token);
        // console.log(a);

        // {
        //     "Records":[
        //         {
        //             "Name":"<無>",
        //             "Token":1,
        //             "Type":0,
        //             "Partition":true,
        //             "PrimaryContactAddress":"",
        //             "PrimaryContactFax":"",
        //             "PrimaryContactMobile":"",
        //             "PrimaryContactName":"",
        //             "PrimaryContactPhone":"",
        //             "PrimaryContactTitle":"",
        //             "SecondaryContactAddress":"",
        //             "SecondaryContactFax":"",
        //             "SecondaryContactMobile":"",
        //             "SecondaryContactName":"",
        //             "SecondaryContactPhone":"",
        //             "SecondaryContactTitle":""
        //         },
        //         {
        //             "Name":"<訪客>",
        //             .......
        return JSON.parse(a)["Records"];
    }

    async getWorkGroup(groupToken: String) {
        Log.Info(`${this.constructor.name}`, `getWorkGroup ${groupToken}`);
        let token = await this.Login();
        let a = await this.siPassPermission.GetWrokGroup(this.siPassHrParam, { token: +groupToken }, token);
        // console.log("===================    Get GetWrokGroup   ========== ", groupToken);
        // console.log(a);
        // {
        //     "Name":"全通",
        //     "Token":2000000001,
        //     "Type":0,
        //     "AccessPolicyRules":[
        //         {
        //             "ObjectToken":"3",
        //             "ObjectName":"N1_NH220_Security",
        //             "RuleToken":"6",
        //             "RuleType":3,
        //             "TimeScheduleToken":"4",
        //             "StartDate":null,
        //             "EndDate":null,
        //             "ArmingRightsId":null,
        //             "ControlModeId":null,
        //             "Side":0
        //         }
        //     ],
        //     "Partition":true,
        //     "PrimaryContactAddress":"",
        //     "PrimaryContactFax":"",
        //     "PrimaryContactMobile":"",
        //     "PrimaryContactName":"",
        //     "PrimaryContactPhone":"",
        //     "PrimaryContactTitle":"",
        //     "SecondaryContactAddress":"",
        //     "SecondaryContactFax":"",
        //     "SecondaryContactMobile":"",
        //     "SecondaryContactName":"",
        //     "SecondaryContactPhone":"",
        //     "SecondaryContactTitle":"",
        //     "CardRange":"-"
        // }

        return JSON.parse(a);

        // let d = {
        //     system: 1,
        //     groupid: rules["Token"],
        //     groupname: rules["Name"],
        //     type: +rules["Type"],
        //     accesspolicyrules: rules["AccessPolicyRules"],
        //     status: 1
        // };

        // await this.mongoDb.collection("WorkGroup").findOneAndDelete({ "groupid": rules["Token"] });
        // let o = new WorkGroup(d);
        // let oo = await o.save();

        // return ParseObject.toOutputJSON(oo);
    }

    async postWorkGroup(workGroup: siPassClient.IWorkGroupObject) {
        Log.Info(`${this.constructor.name}`, `postAccessGroup ${workGroup}`);
        let token = await this.Login();
        let a = await this.siPassPermission.CreateWorkGroup(this.siPassHrParam, workGroup, token);

        return JSON.parse(a);
    }

    async putWorkGroup(workGroup: siPassClient.IWorkGroupObject) {
        Log.Info(`${this.constructor.name}`, `putWorkGroup ${workGroup}`);
        let token = await this.Login();
        let a = await this.siPassPermission.UpdateWorkGroup(this.siPassHrParam, workGroup, token);

        return JSON.parse(a);
    }

    async getCardHolderList(sessionId:string) {
        Log.Info(`${this.constructor.name}`, `getCardHolderList`);

        let a = await this.siPassPersion.GetAllPersons(this.siPassHrParam, sessionId);
        // console.log(a);
        // {
        //     "Records":[{
        //             "Status":61,
        //             "Token":"18",
        //             "Potrait":"api/V1/cardholders/images?imgId=18&token=948184FE8A4C4C262B29E1FEFE4357E5C5F245C6E5E440816B92B3DF5E81BD&noCache=2096819098",
        //             "_links":[]
        //         }
        //     ],
        // }

        return JSON.parse(a)["Records"];
    }

    async getCardHolder(holderToken: string, sessionId:string) {
        Log.Info(`${this.constructor.name}`, `getCardHolder ${holderToken}`);

        let a = await this.siPassPersion.GetPerson(this.siPassHrParam, { token: holderToken }, sessionId);

        {
            // {
            //     "Attributes": {},
            //     "Credentials": [],
            //     "AccessRules": [],
            //     "EmployeeNumber": "",
            //     "EndDate": "2018-02-01T04:36:59+08:00",
            //     "FirstName": "Nizar",
            //     "GeneralInformation": "",
            //     "LastName": "Khan",
            //     "PersonalDetails": {
            //         "Address": "",
            //         "ContactDetails": {
            //             "Email": "",
            //             "MobileNumber": "",
            //             "MobileServiceProviderId": "0",
            //             "PagerNumber": "",
            //             "PagerServiceProviderId": "0",
            //             "PhoneNumber": ""
            //         },
            //         "DateOfBirth": "",
            //         "PayrollNumber": "",
            //         "Title": "",
            //         "UserDetails": {
            //             "Password": "",
            //             "UserName": ""
            //         }
            //     },
            //     "PrimaryWorkgroupId": 2000000000,
            //     "ApbWorkgroupId": 2000000000,
            //     "PrimaryWorkgroupName": "<訪客>",
            //     "NonPartitionWorkGroups": [],
            //     "SmartCardProfileId": "0",
            //     "StartDate": "2018-01-24T16: 37: 00+08: 00",
            //     "Status": 63,
            //     "Token": "7",
            //     "TraceDetails": {},
            //     "Vehicle1": {
            //         "CarColor": "",
            //         "CarModelNumber": "",
            //         "CarRegistrationNumber": ""
            //     },
            //     "Vehicle2": {
            //         "CarColor": "",
            //         "CarModelNumber": "",
            //         "CarRegistrationNumber": ""
            //     },
            //     "Potrait": "api/V1/cardholders/images?imgid=7&token=33D8CF143161594DFA1F56AB5C33F8F18D1601FB99F9B4B998481741886484&noCache=1279120740",
            //     "PrimaryWorkGroupAccessRule": [],
            //     "NonPartitionWorkgroupAccessRules": [],
            //     "VisitorDetails": {
            //         "VisitedEmployeeFirstName": "",
            //         "VisitedEmployeeLastName": "",
            //         "VisitorCardStatus": 0,
            //         "VisitorCustomValues": {
            //             "Company": "",
            //             "Profile": "",
            //             "Reason": "",
            //             "License": "",
            //             "Email": "",
            //             "RestrictedUser": "0"
            //         }
            //     },
            //     "CustomFields": [
            //         {
            //             "FiledName": "CustomTextBoxControl8__CF"         Unknown
            //         },
            //         {
            //             "FiledName": "CustomDropdownControl1__CF"        憑證類型
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl1__CF"         憑證全碼
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl2__CF"         憑證保管人
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl3__CF"         上次修改者
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl6__CF"         公司/廠商名稱
            //         },
            //         {
            //             "FiledName": "CustomDateControl2__CF"            上次修改日期
            //         },
            //         {
            //             "FiledName": "CustomDropdownControl2__CF_CF"     性別
            //         },
            //         {
            //             "FiledName": "CustomDropdownControl2__CF"        車證類別
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl5__CF_CF"      MVPN
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl5__CF_CF_CF"   部門名稱
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF"    成本中心代碼
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF" 地區
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF"  工作區域
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF"   座位編號
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF"    車證編號
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF" 車位編號
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF"  車牌號碼II
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF"   車牌號碼III
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl5__CF" 車牌號碼I
            //         },
            //         {
            //             "FiledName": "CustomDateControl1__CF_CF"出生日期
            //         },
            //         {
            //             "FiledName": "CustomDateControl1__CF_CF_CF"報到日期
            //         },
            //         {
            //             "FiledName": "CustomDateControl1__CF"離職日期
            //         },
            //         {
            //             "FiledName": "CustomDropdownControl3__CF_CF"製卡原因I
            //         },
            //         {
            //             "FiledName": "CustomDropdownControl3__CF_CF_CF"製卡原因II
            //         },
            //         {
            //             "FiledName": "CustomDropdownControl3__CF_CF_CF_CF"製卡原因III
            //         },
            //         {
            //             "FiledName": "CustomDropdownControl3__CF_CF_CF_CF_CF"申請原因I
            //         },
            //         {
            //             "FiledName": "CustomDropdownControl3__CF_CF_CF_CF_CF_CF"申請原因II
            //         },
            //         {
            //             "FiledName": "CustomDropdownControl3__CF"申請原因III
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl7__CF_CF"離職備註
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl7__CF_CF_CF"離職繳回紀錄_證卡
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF"歷史卡號I
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF"歷史卡號II
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF"歷史卡號III
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF"離職繳回紀錄_車證
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF"違規說明I
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF"違規說明II
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF"違規說明III
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF"普查紀錄I
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF"普查紀錄II
            //         },
            //         {
            //             "FiledName": "CustomTextBoxControl7__CF"普查紀錄III
            //         },
            //         {
            //             "FiledName": "CustomDateControl3__CF_CF"發卡日期I
            //         },
            //         {
            //             "FiledName": "CustomDateControl3__CF_CF_CF"發證日期II
            //         },
            //         {
            //             "FiledName": "CustomDateControl3__CF_CF_CF_CF"發證日期III
            //         },
            //         {
            //             "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF"發證日期I
            //         },
            //         {
            //             "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF"發卡日期II
            //         },
            //         {
            //             "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF"發卡日期III
            //         },
            //         {
            //             "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF"違規日期I
            //         },
            //         {
            //             "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF"違規日期II
            //         },
            //         {
            //             "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF"違規日期III
            //         },
            //         {
            //             "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF"普查日期I
            //         },
            //         {
            //             "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF"普查日期II
            //         },
            //         {
            //             "FiledName": "CustomDateControl3__CF"普查日期III
            //         }
            //     ],
            //     "FingerPrints": [],
            //     "CardholderPortrait": "/9j/4AAQSkZJRgABAgAAYABgAAD //gAcQ3JlYXRlZCBieSBBY2N1U29mdCBDb3JwLgD/wAARCABgAGADASIAAhEBAxEB/9sAhAAIBQYHBgUIBwcHCQkICg0VDg0LCw0aEhQPFR8bISAeGx4dIicxKiIkLyUdHis7Ky8zNTc4NyEpPUE8NkExNjc1AQkJCQ0LDRkODhk1Ix4jIzU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTX/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APbKKKKACiis/XNXt9Gs/Pn+Z24jjHVz/h70AaB4BJ4A71Qn1vSrdisuoW6sOwfP8q841fXb/VnJuJisXaFOFH4d/wAazcYoA9at9a0u4YLFqFuzHtvAP61e7A9jXi+K0dJ13UNKcfZ5yY+8T8qfw7fhQB6vRWV4f1621qEmP93cIPnhJ5HuPUVq0AFFFFABRRRQAV5X4m1NtU1eabP7pDsiHoo/x616ZqLmLTrp1+8sTkfka8eHQUALRRRQAUUUUATWN3NY3UdzbvsljOQf6H2r1jSr6PUtPhu4xhZFyV/unuPzryGvRPh45bQXU9FnYD8gaAOkooooAKKKKAGTxCaCSI9HUr+YxXjbIY2KMMFTg/hXs44ryfxFEIdev41GAJmI/Hn+tAGfRRRQAUUUUAFei/D6Mp4fLf35mI/Qf0rzqu6+G0kjWV5GSTGkilR6Eg5/kKAOuooooAKKKKACvMPGkXleJbv/AGirfmor0+uA+I1v5erW84HEsWPxU/8A1xQBy1FFFABRRRQAV6V4IsGsdCRpFKyXDGUg9QOg/QfrXKeBrGO91wGaNZI4ULlWGRnoP516TQAUUUUAFFFFABXP+OtPN7opmRcyWx8wf7vRv8fwroKqavew6dps91OAyIuNn94ngD8aAPIqKViCxIUKCeg6CkoAKKKKAOx+GgXz788b9qDHtk //AFq7evKfDWoHTdZt59+2Itskz02nrn+f4V6qrK6hkYMp6MpyDQAtFFFABRWJ4h8S2uj/ALpR590RxEDgL/vHt9K4jVPEmp6kCks/lxH/AJZxfKPx7mgDuNX8Uabpm5PM+0Tj/lnEc4+p6CuI17xDea1tSUJHArbliT19Se9ZHSigAooooAKKKKACrmnapfaa2bS5kjH93OVP1HSqdFAHc6V45hcLHqMBjb/nrEMr+I6j9a6iyvbW+i8y1njmX/YOcfUdq8ep8E0tvKJYZHjkHRkODQB //9k=",
            //     "_links": []
            // }
        }

        return JSON.parse(a);
    }

    async postCardHolder(cardholeder: siPassClient.ICardholderObject) {
        //Log.Info(`${this.constructor.name}`, `postCardHolder ${cardholeder}`);
        let token = await this.Login();
        let a = await this.siPassPersion.CreatePerson(this.siPassHrParam, cardholeder, token);

        return JSON.parse(a);
    }

    async putCardHolder(cardholeder: siPassClient.ICardholderObject) {
        //Log.Info(`${this.constructor.name}`, `postCardHolder ${cardholeder}`);
        let token = await this.Login();
        let a = await this.siPassPersion.UpdatePerson(this.siPassHrParam, cardholeder, token);

        return JSON.parse(a);
    }

    async getAllCredentialProfiles() {
        let sessionId = await this.Login();
        let a = await this.siPassPersion.GetAllCredentialProfiles(this.siPassHrParam, sessionId);
        // console.log("===================    Get GetAllCredentialProfiles   ========== ");
        // console.log(a);

        // [
        //     {
        //         "Token": "1",
        //         "Name": "基礎",
        //         "PINDigits": 0,
        //         "CardNumberDigits": 7,
        //         "IsBase": true,
        //         "CardTechnology": "HID Proximity Corporate 1000 35/48 Bit",
        //         "FacilityCode": "469",
        //         "CardTechnologyCode": 10,
        //         "ValidityCode": "0",
        //         "IsUsed": true,
        //         "PinMode": [
        //             {
        //                 "Type": 1,
        //                 "Name": "Card",
        //                 "FullName": "Card",
        //                 "IsUsed": true
        //             },
        //             {
        //                 "Type": 2,
        //                 "Name": "Pin",
        //                 "FullName": "Pin"
        //             }
        //         ],
        //         "PINModeValue": {
        //             "Name": "CARD",
        //             "FullName": "CARD"
        //         }
        //     }
        // ]

        return JSON.parse(a);
    }
}

// export default new SiPassAdapter();

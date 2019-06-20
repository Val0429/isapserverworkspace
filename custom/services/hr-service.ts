import { Config } from 'core/config.gen';

import { Log } from 'helpers/utility';

import { ScheduleActionEmail } from 'core/scheduler-loader';

import * as mongo from 'mongodb';

import * as siPassClient from './../modules/acs/sipass';
import { IAccessLevelObject, ICardholderPersonal } from './../modules/acs/sipass';
import { IAccessGroupObject } from './../modules/acs/sipass';
import { ICardholderAccessRule } from './../modules/acs/sipass';
import { IWorkGroupObject } from './../modules/acs/sipass';
import { ICardholderObject } from './../modules/acs/sipass';
import { from } from 'rxjs/observable/from';
import { printNode } from 'ts-simple-ast';

export class HRService {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec
    private cycleTime: number = 600; // sec

    private client: mongo.MongoClient;
    private db: mongo.Db;

    private siPassHrParam: siPassClient.SiPassHrApiGlobalParameter;
    private siPassMsParam: siPassClient.SiPassMsApiGlobalParameter;
    private siPassHrAccount: siPassClient.SiPassHrAccountService;
    private siPassMsAccount: siPassClient.SiPassMsAccountService;
    private siPassPersion: siPassClient.SiPassPersonService;
    private siPassPermission: siPassClient.SiPassPermissionService;
    private siPassEvents: siPassClient.SiPassMsEventService;

    constructor() {
        var me = this;

        this.siPassHrParam = new siPassClient.SiPassHrApiGlobalParameter({
            "userName": "siemens",
            "password": "!QAZ1qaz",
            "uniqueId": "590db17a8468659361f13072d0e198b7290ce7a1",
            "domain": "sipasssrv",
            "port": "8745",
            "sessionId": ""
        });

        this.siPassMsParam = new siPassClient.SiPassMsApiGlobalParameter({
            "userName": "siemens",
            "password": "!QAZ1qaz",
            "uniqueId": "590db17a8468659361f13072d0e198b7290ce7a1",
            "domain": "sipasssrv",
            "port": "8744",
            "sessionId": ""
        });

        //this.siPassHrAccount = new siPassClient.SiPassHrAccountService(this.siPassHrParam);
        this.siPassMsAccount = new siPassClient.SiPassMsAccountService(this.siPassMsParam);
        //this.siPassPersion = new siPassClient.SiPassPersonService();
        //this.siPassPermission = new siPassClient.SiPassPermissionService();
        this.siPassEvents = new siPassClient.SiPassMsEventService();
        

        this.waitTimer = setTimeout(() => {
            me.doHumanResourcesSync();
        }, 1000 * this.startDelayTime);
    }

    async doHumanResourcesSync() {
        Log.Info(`${this.constructor.name}`, `2.0 Timer Check`);

        var me = this;
        let now: Date = new Date();

        clearTimeout(this.waitTimer);

        var testhr = now.getHours();

        // if ((now.getHours() == 0) && (now.getMinutes() == 0)) {
        if ((now.getHours() != 0)) {
            // 1.0 create database connection
            Log.Info(`${this.constructor.name}`, `2.0 create database connection`);
            // (async () => {
            const url = `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}`;
            this.client = await mongo.MongoClient.connect(url);
            this.db = await this.client.db(Config.mongodb.collection);
            // })();

            // 2.0 import data
            Log.Info(`${this.constructor.name}`, `2.1 clear temp/log tables`);
            this.db.collection("i_vieChangeMemberLog").deleteMany({});
            this.db.collection("i_vieHQMemberLog").deleteMany({});
            this.db.collection("i_vieREMemberLog").deleteMany({});

            Log.Info(`${this.constructor.name}`, `2.2 request device adapter data`);

            //let ret = await this.siPassHrAccount.Login(this.siPassHrParam);
            let ret = await this.siPassMsAccount.Login(this.siPassMsParam);
            console.log(ret);

            let uri = await this.siPassEvents.SubscribeMessage(this.siPassMsParam);
            await this.siPassEvents.ReceiveMessage(this.siPassMsParam);

/*

            //ret = await this.siPassPersion.GetAllPersons(this.siPassHrParam);

            //ret = await this.siPassPermission.GetAllPermission(this.siPassHrParam)
            //IAccessLevelObject 

            //ret = await this.siPassPermission.GetPermission(this.siPassHrParam,{"token":"1"});


            var ruleobj1: ICardholderAccessRule = {
                "armingRightsId": null,
                "controlModeId": null,
                "endDate": null,
                "objectName": "NH220_04F_01_R1_04G001_IN",
                "objectToken": "12",
                "ruleToken": "12",
                "ruleType": 2,
                "timeScheduleToken": "4",
                "startDate": null
            }

            var ruleobj2: ICardholderAccessRule = {
                "armingRightsId": null,
                "controlModeId": null,
                "endDate": null,
                "objectName": "NH220_04F_01_R1_04G001_OUT",
                "objectToken": "13",
                "ruleToken": "13",
                "ruleType": 2,
                "timeScheduleToken": "4",
                "startDate": null
            }

            var levelobj1: IAccessLevelObject = {
                "name": "0612Test9999",
                "timeScheduleToken": "4",
                "token": "14",
                "isFavourite": true,
                "accessRule": [ruleobj1, ruleobj2]

            }

            var levelobj2: IAccessLevelObject = {
                "name": "後門1",
                //"timeScheduleToken" :"4",
                "token": "2",
                //"isFavourite" : true,
                //"accessRule" :[ ruleobj1,ruleobj2]

            }

            var groupobj: IAccessGroupObject = {
                "name": "0612GTUpdate",
                "token": "8",
                "accessLevels": [levelobj1, levelobj2]
            }

            var workgroupobj: IWorkGroupObject = {
                "name": "mor0612Test99",
                "token": -1,
                "type": 0,
                "accessPolicyRules": [ruleobj1],
                "partition": true,
                "primaryContactAddress": "123",
                "primaryContactFax": "456",
                "primaryContactMobile": "789",
                "primaryContactName": "000",
                "primaryContactPhone": "123456",
                "primaryContactTitle": "777777",
                "secondaryContactAddress": "",
                "secondaryContactFax": "",
                "secondaryContactMobile": "",
                "secondaryContactName": "",
                "secondaryContactPhone": "",
                "secondaryContactTitle": "",
                "void": true,
                //"smartCardProfileId": "",
                "cardRange": ""
            }

            var workgroupobj2: IWorkGroupObject = {
                "name": "mor0612TestUpdate",
                "token": 2000000019,
                "type": 0,
                "accessPolicyRules": [ruleobj1],
                "partition": true,
                "primaryContactAddress": "123",
                "primaryContactFax": "456",
                "primaryContactMobile": "789",
                "primaryContactName": "000",
                "primaryContactPhone": "123456",
                "primaryContactTitle": "777777",
                "secondaryContactAddress": "",
                "secondaryContactFax": "",
                "secondaryContactMobile": "",
                "secondaryContactName": "",
                "secondaryContactPhone": "",
                "secondaryContactTitle": "",
                "void": true,
                //"smartCardProfileId": "",
                "cardRange": ""
            }

            //------------------------------------------//
            var att: siPassClient.ICardholderAttributes = {
                accessibility: false,
                apbExclusion: false,
                apbReEntryExclusion: false,
                isolate: false,
                selfAuthorize: false,
                supervisor: false,
                visitor: false,
                void: false,
                restrictedVisitor: false
            }

            var credentialsObj: siPassClient.ICardholderCredential = {
                active: true,
                cardNumber: "86081",
                endDate: '2100-01-01T23:59:59',
                pin: 902502,
                revisionNumber: 0,
                pinErrorDisable: true,
                profileId: 1,
                profileName: "基礎",
                startDate: '2018-01-01T00:00:00',
                facilityCode: 0,
                cardTechnologyCode: 26,
                pinMode: 4,
                pinDigit: 6
            }

            var cardContactDetailObj: siPassClient.ICardholderContactDetails = {
                "email": "",
                "mobileNumber": "",
                "mobileServiceProvider": null,
                "mobileServiceProviderId": "0",
                "pagerNumber": "",
                "pagerServiceProvider": null,
                "pagerServiceProviderId": "0",
                "phoneNumber": "",
                "useEmailforMessageForward": false
                
            }

            var cardUserDetailObj: siPassClient.ICardholderUserDetails = {
                "userName": "",
                "password": ""
            }

            var personalDetailObj: siPassClient.ICardholderPersonal = {
                address: "",
                "contactDetails": cardContactDetailObj,
                dateOfBirth: "",
                payrollNumber: "",
                title: "",
                "userDetails": cardUserDetailObj

            }

            var cardholderTraceObj: siPassClient.ICardholderTrace = {
                cardLastUsed: null,
                cardNumberLastUsed: null,
                lastApbLocation: null,
                pointName: null,
                traceCard: false
            }

            var cardholderWorkGpAccessRuleObj: siPassClient.ICardholderWorkGroupAccessRule = {
                workGroupId: 2000000009,
                workGroupName: "約聘",
                accessPolicyRules: [ruleobj1]

            }

            var cardholderobj: ICardholderObject = {
                "attributes": att,
                "credentials": [credentialsObj],
                "baseCardNumber": null,
                "accessRules": [ruleobj1],
                "employeeNumber": "MI-00099",
                "endDate": "2100-01-01T23:59:59",
                "firstName": "Rd",
                "generalInformation": "",
                "lastName": "morris1",
                "employeeName": null,
                "personalDetails": personalDetailObj,
                "primaryWorkgroupId": 2000000009,
                "apbWorkgroupId": 2000000009,
                "primaryWorkgroupName": "約聘",
                "nonPartitionWorkGroups": [],
                "smartCardProfileId": "0",
                "smartCardProfileName": null,
                "startDate": "2018-01-01T00:00:00",
                "status": siPassClient.ECardholderStatus.None,
                "token": "-1",
                "traceDetails": cardholderTraceObj,
                "vehicle1": {
                    "carColor": "",
                    "carModelNumber": "",
                    "carRegistrationNumber": ""
                },
                "vehicle2": {
                    "carColor": "",
                    "carModelNumber": "",
                    "carRegistrationNumber": ""
                },
                "potrait": null, //optional
                "primaryWorkGroupAccessRule": null,//[ruleobj1],
                "nonPartitionWorkgroupAccessRules": null, // [cardholderWorkGpAccessRuleObj],
                "visitorDetails": {
                    "visitedEmployeeFirstName": "",
                    "visitedEmployeeId": 0,
                    "visitedEmployeeLastName": "",
                    "visitorCardIssueTime": null,
                    "visitorCardReturnTime": null,
                    "visitorCardStatus": 0,
                    "visitorCustomValues": {}
                },
                "customFields": [],
                "fingerPrints": null,
                "cardholderPortrait": null,
                "isImageChanged": false,
                "isSignatureChanged": false,
                "cardholderSignature": null,
                "elevatorRole": siPassClient.EElevatorRole.None,
                "elevatorLight": 0,
                "elevatorLanguage": 0,
                "startDateWithoutTime": null,
                "endDateWithoutTime": null,
                "lastUpdatedDateTime": null,
                "reference": 0,
                "_links": [],
                "_embedded": null
            }

            var cardholderobjUpdate: ICardholderObject = {
                "attributes": att,
                "credentials": [credentialsObj],
                "baseCardNumber": null,
                "accessRules": [ruleobj1],
                "employeeNumber": "MI-00099",
                "endDate": "2100-01-01T23:59:59",
                "firstName": "Rd Update",
                "generalInformation": "",
                "lastName": "morris1 Update",
                "employeeName": null,
                "personalDetails": personalDetailObj,
                "primaryWorkgroupId": 2000000009,
                "apbWorkgroupId": 2000000009,
                "primaryWorkgroupName": "約聘",
                "nonPartitionWorkGroups": [],
                "smartCardProfileId": "0",
                "smartCardProfileName": null,
                "startDate": "2018-01-01T00:00:00",
                "status": siPassClient.ECardholderStatus.Vaild,
                "token": "22",
                "traceDetails": cardholderTraceObj,
                "vehicle1": {
                    "carColor": "",
                    "carModelNumber": "",
                    "carRegistrationNumber": ""
                },
                "vehicle2": {
                    "carColor": "",
                    "carModelNumber": "",
                    "carRegistrationNumber": ""
                },
                "potrait": null, //optional
                "primaryWorkGroupAccessRule": null,//[ruleobj1],
                "nonPartitionWorkgroupAccessRules": null, // [cardholderWorkGpAccessRuleObj],
                "visitorDetails": {
                    "visitedEmployeeFirstName": "",
                    "visitedEmployeeId": 0,
                    "visitedEmployeeLastName": "",
                    "visitorCardIssueTime": null,
                    "visitorCardReturnTime": null,
                    "visitorCardStatus": 0,
                    "visitorCustomValues": {}
                },
                "customFields": [],
                "fingerPrints": null,
                "cardholderPortrait": null,
                "isImageChanged": false,
                "isSignatureChanged": false,
                "cardholderSignature": null,
                "elevatorRole": siPassClient.EElevatorRole.None,
                "elevatorLight": 0,
                "elevatorLanguage": 0,
                "startDateWithoutTime": null,
                "endDateWithoutTime": null,
                "lastUpdatedDateTime": null,
                "reference": 0,
                "_links": [],
                "_embedded": null
            }
            //ret = await this.siPassPermission.CreatePermission(this.siPassHrParam,levelobj);
            //ret = await this.siPassPermission.UpdatePermission(this.siPassHrParam,levelobj);
            //ret = await this.siPassPermission.CreatePermissionTable(this.siPassHrParam,groupobj);
            //ret = await this.siPassPermission.UpdatePermissionTable(this.siPassHrParam,groupobj);
            //ret = await this.siPassPermission.CreateWorkGroup(this.siPassHrParam,workgroupobj);
            //ret = await this.siPassPermission.UpdateWorkGroup(this.siPassHrParam,workgroupobj2);
            //ret = await this.siPassPersion.CreatePerson(this.siPassHrParam, cardholderobj);
            //ret = await this.siPassPersion.UpdatePerson(this.siPassHrParam, cardholderobjUpdate);
            //var jsonObj = JSON.parse(ret);
            //let rawData = jsonObj.Token;
            //console.log(`rawData :${rawData}`);
            //var sipassSessionID = rawData;
            //= jsonObj.Token;

            //console.log(`sipassSessionID :${sipassSessionID}`);
            //ret = await this.siPassDevice.Logout({"sessionId": ret.Token, "clientUniqueId": "590db17a8468659361f13072d0e198b7290ce7a1"});

            //console.dir(ret, {depth: null})
            console.log(ret);

            Log.Info(`${this.constructor.name}`, `2.3 import sync data`);
*/

            // 3.0 compare data
            Log.Info(`${this.constructor.name}`, `3.0 compare data`);


            // 4.0 request human information
            Log.Info(`${this.constructor.name}`, `4.0 request human information`);


            // 5.1 write data to SiPass database
            Log.Info(`${this.constructor.name}`, `5.1 write data to SiPass database`);


            // 5.2 write data to CCure800 database
            Log.Info(`${this.constructor.name}`, `5.2 write data to CCure800 database`);


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
            this.client.close();
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
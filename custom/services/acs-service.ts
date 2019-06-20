import { Config } from 'core/config.gen';

import { Log } from 'helpers/utility';

import { ScheduleActionEmail } from 'core/scheduler-loader';

import * as mongo from 'mongodb';
// import * as msSQL from 'mssql';

// import * as siPassClient from '../modules/acs/sipass';
// import { IAccessLevelObject, IAccessGroupObject, ICardholderAccessRule, IWorkGroupObject } from '../modules/acs/sipass';

// import { CCUREReader } from '../modules/acs/ccure800';

import { Reader, Door, Elevator, DoorGroup, Member, TimeSchedule, AccessLevel, PermissionTable, WorkGroup, AccessPolicy } from '../../custom/models'
import { RegularExpressionLiteral, ThrowStatement } from 'ts-simple-ast';

import * as delay from 'delay';
import { ParseObject } from 'core/cgi-package';

import { SiPassAdapter } from './acs/SiPass';

export class ACSService {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec
    private cycleTime: number = 600; // sec

    private mongoClient: mongo.MongoClient;
    private mongoDb: mongo.Db;

    // CCure800
    // private ccur800: CCUREReader;

    // SiPass
    private adSiPass: SiPassAdapter;
    // private siPassHrParam: siPassClient.SiPassHrApiGlobalParameter;
    // private siPassAccount: siPassClient.SiPassHrAccountService;
    // private siPassDevice: siPassClient.SiPassDeviceService;
    // private siPassPersion: siPassClient.SiPassPersonService;
    // private siPassPermission: siPassClient.SiPassPermissionService;
    // private siPassTimeScheule: siPassClient.SiPassTimeScheuleService;

    constructor() {
        var me = this;

        // 1.0 Login to Datebase
        Log.Info(`${this.constructor.name}`, `1.0 Login database connection`);
        (async () => {
            await me.initialAdapterConnection();
        })();

        // this.ccur800 = new CCUREReader();


        this.waitTimer = setTimeout(async () => {
            me.doAccessControlSync();
        }, 1000 * this.startDelayTime);
    }

    async initialAdapterConnection() {
        const url = `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}`;
        this.mongoClient = await mongo.MongoClient.connect(url);
        this.mongoDb = await this.mongoClient.db(Config.mongodb.collection);
    }

    async doAccessControlSync() {
        Log.Info(`${this.constructor.name}`, `2.0 Timer Check`);

        var me = this;
        let now: Date = new Date();

        clearTimeout(this.waitTimer);

        // if ((now.getHours() == 0) && (now.getMinutes() == 0)) {  // Startup @00:00
        if (now.getMinutes() != 0) {
            // 0.0 Initial Adapter
            Log.Info(`${this.constructor.name}`, `0.0 Initial Adapter`);
            this.adSiPass = new SiPassAdapter();

            // let a: string = "";
            // let records: object[] = [];

            // let timeschedules: { token: string, objectId: string }[] = [];
            // let readers: { token: string, objectId: string }[] = [];
            // let doors: { token: string, objectId: string }[] = [];

            // 2.0 get date from SiPass            
            // 2.2 Login
            {
                Log.Info(`${this.constructor.name}`, `2.1 Initial Adapter`);
                let sessionId = await this.adSiPass.Login();
            }
            await delay(1000);

            // 2.2 Time Schedule
            {
                Log.Info(`${this.constructor.name}`, `2.2 Time Schedule`);
                let records = await this.adSiPass.getTimeSchedule();

                for (let idx = 0; idx < records.length; idx++) {
                    const r = records[idx];
                    let d = {
                        system: 1,
                        timeid: r["Token"],
                        timename: r["Name"],
                        status: 1
                    };

                    await this.mongoDb.collection("TimeSchedule").findOneAndDelete({ "timeid": r["Token"] });
                    let o = new TimeSchedule(d);
                    await o.save();
                };
            }
            await delay(1000);

            // 2.3 Door Readers
            {
                Log.Info(`${this.constructor.name}`, `2.3 Door Readers`);
                let records = await this.adSiPass.getReaders();

                for (let idx = 0; idx < records.length; idx++) {
                    const r = records[idx];
                    let d = {
                        system: 1,
                        readerid: r["Token"],
                        readername: r["Name"],
                        status: 1
                    };
                    await this.mongoDb.collection("Reader").findOneAndDelete({ "readerid": r["Token"] });
                    let o = new Reader(d);
                    await o.save();
                };

            }
            await delay(1000);

            // 2.4 Doors
            {
                Log.Info(`${this.constructor.name}`, `2.4 Doors`);
                let records = await this.adSiPass.getDoors();

                for (let idx = 0; idx < records.length; idx++) {
                    const r = records[idx];
                    let d = {
                        system: 1,
                        doorid: +r["Token"],
                        doorname: r["Name"],
                        status: 1
                    };

                    await this.mongoDb.collection("Door").findOneAndDelete({ "doorid": r["Token"] });
                    let o = new Door(d);
                    await o.save();
                };
            }
            await delay(1000);

            // 2.5 Floors
            {
                Log.Info(`${this.constructor.name}`, `2.5 Floors`);
                let records = await this.adSiPass.getFloors();
            }
            await delay(1000);

            // 2.6 Elevators
            {
                Log.Info(`${this.constructor.name}`, `2.6 Elevators`);
                let records = await this.adSiPass.getElevators();
            }

            // 2.7 Access Group List
            {
                Log.Info(`${this.constructor.name}`, `2.7 Access Group List`);

                let grouplist = await this.adSiPass.getAccessGroupList();

                for (let i = 0; i < grouplist.length; i++) {
                    let group = await this.adSiPass.getAccessGroup(grouplist[i]["Token"]);

                    for (let j = 0; j < group["AccessLevels"].length; j++) {
                        let level = await this.adSiPass.getAccessLevel(group["AccessLevels"][j]["Token"]);

                        let tsid = "";
                        let b = await this.mongoDb.collection("TimeSchedule").find({ "timeid": level["TimeScheduleToken"] }).limit(1);
                        // for (let idx1 = 0; idx1 < timeschedules.length; idx1++) {
                        //     const r = timeschedules[idx1];
                        //     if (r.token == level["TimeScheduleToken"]) {
                        //         tsid = r.objectId;
                        //         break;
                        //     }
                        // }
                        // console.log("========================");
                        // console.log(tsid);

                        // let rs = [];
                        // for (let idx1 = 0; idx1 < level["AccessRule"].length; idx1++) {
                        //     let rule = level["AccessRule"][idx1];
                        //     for (let idx2 = 0; idx2 < readers.length; idx2++) {
                        //         const r = readers[idx2];
                        //         if (r.token == rule["ObjectToken"]) {
                        //             rs.push(r.objectId);
                        //             break;
                        //         }
                        //     }
                        // };
                        // console.log("========================");
                        // console.log(rs);

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

                        // console.log(ret);
                        // // levels.push(ret["_id"]);
                        // await delay(1000);
                    }
                }
            }
            await delay(1000);

            // 2.8 Work Group List
            {
                Log.Info(`${this.constructor.name}`, `2.8 Work Group List`);

                let grouplist = await this.adSiPass.getWorkGroupList();
                for (let idx = 0; idx < grouplist.length; idx++) {

                    Log.Info(`${this.constructor.name}`, `2.8.1 Work Group`);
                    let group = await this.adSiPass.getWorkGroup(grouplist[idx]["Token"]);

                    let d = {
                        system: 1,
                        groupid: group["Token"],
                        groupname: group["Name"],
                        type: +group["Type"],
                        accesspolicyrules: group["AccessPolicyRules"],
                        status: 1
                    };

                    await this.mongoDb.collection("WorkGroup").findOneAndDelete({ "groupid": group["Token"] });
                    let o = new WorkGroup(d);
                    await o.save();
                }
            }
            await delay(1000);

            // 2.9 Get Card Holder List
            {
                Log.Info(`${this.constructor.name}`, `2.9 Get Card Holder List`);

                let grouplist = await this.adSiPass.getCardHolderList();
                for (let idx = 0; idx < grouplist.length; idx++) {
                    Log.Info(`${this.constructor.name}`, `2.9.1 Get Card Holder`);
                    let holder = await this.adSiPass.getCardHolder(grouplist[idx]["Token"]);

                    let d = {
                        system: 1,    
                        Attributes: holder["Attributes"],
                        Credentials: holder["Credentials"],
                        AccessRules: holder["AccessRules"],
                        EmployeeNumber: holder["EmployeeNumber"],
                        EndDate: holder["EndDate"],
                        FirstName: holder["FirstName"],
                        GeneralInformation: holder["GeneralInformation"],
                        LastName: holder["LastName"],
                        PersonalDetails: {
                            Address: holder["PersonalDetails"]["Address"],
                            ContactDetails: {
                                Email: holder["PersonalDetails"]["ContactDetails"]["Email"],
                                MobileNumber: holder["PersonalDetails"]["ContactDetails"]["MobileNumber"],
                                MobileServiceProviderId: holder["PersonalDetails"]["ContactDetails"]["MobileServiceProviderId"],
                                PagerNumber: holder["PersonalDetails"]["ContactDetails"]["PagerNumber"],
                                PagerServiceProviderId: holder["PersonalDetails"]["ContactDetails"]["PagerServiceProviderId"],
                                PhoneNumber: holder["PersonalDetails"]["ContactDetails"]["PhoneNumber"]
                            },
                            DateOfBirth: holder["PersonalDetails"]["DateOfBirth"],
                            PayrollNumber: holder["PersonalDetails"]["PayrollNumber"],
                            Title: holder["PersonalDetails"]["Title"],
                            UserDetails: {
                                Password: holder["PersonalDetails"]["UserDetails"]["Password"],
                                UserName: holder["PersonalDetails"]["UserDetails"]["UserName"],
                            }
                        },
                        PrimaryWorkgroupId: holder["PrimaryWorkgroupId"],
                        ApbWorkgroupId: holder["ApbWorkgroupId"],
                        PrimaryWorkgroupName: holder["PrimaryWorkgroupName"],
                        NonPartitionWorkGroups: holder["NonPartitionWorkGroups"],
                        SmartCardProfileId: holder["SmartCardProfileId"],
                        StartDate: holder["StartDate"],
                        Status: holder["Status"],
                        Token: holder["Token"],
                        TraceDetails: holder["TraceDetails"],
                        Vehicle1: {
                            CarColor: holder["Vehicle1"]["CarColor"],
                            CarModelNumber: holder["Vehicle1"]["CarModelNumber"],
                            CarRegistrationNumber: holder["Vehicle1"]["CarRegistrationNumber"]
                        },
                        Vehicle2: {
                            CarColor: holder["Vehicle2"]["CarColor"],
                            CarModelNumber: holder["Vehicle2"]["CarModelNumber"],
                            CarRegistrationNumber: holder["Vehicle2"]["CarRegistrationNumber"]
                        },
                        Potrait: holder["Potrait"],
                        PrimaryWorkGroupAccessRule: holder["PrimaryWorkGroupAccessRule"],
                        NonPartitionWorkgroupAccessRules:holder["NonPartitionWorkgroupAccessRules"],
                        VisitorDetails: {
                            VisitedEmployeeFirstName: holder["VisitorDetails"]["VisitedEmployeeFirstName"],
                            VisitedEmployeeLastName: holder["VisitorDetails"]["VisitedEmployeeLastName"],
                            VisitorCardStatus: holder["VisitorDetails"]["VisitorCardStatus"],
                            VisitorCustomValues: {
                                Company: holder["VisitorDetails"]["VisitorCustomValues"]["Company"],
                                Profile: holder["VisitorDetails"]["VisitorCustomValues"]["Profile"],
                                Reason: holder["VisitorDetails"]["VisitorCustomValues"]["Reason"],
                                License: holder["VisitorDetails"]["VisitorCustomValues"]["License"],
                                Email: holder["VisitorDetails"]["VisitorCustomValues"]["Email"],
                                RestrictedUser: holder["VisitorDetails"]["VisitorCustomValues"]["RestrictedUser"],
                            }
                        },
                        CustomFields: holder["CustomFields"],
                        FingerPrints:holder["FingerPrints"],
                        CardholderPortrait:holder["CardholderPortrait"]
                    }
                    await this.mongoDb.collection("Member").findOneAndDelete({ "Token": d["Token"] });
                    let o = new Member(d);
                    await o.save();
                }
            }
            await delay(1000);

            // 3.0 get data from CCure800




            // 4.0 report log and send smtp 
            Log.Info(`${this.constructor.name}`, `4.0 report log and send smtp`);
            // let file = new Parse.File("snapshot.jpg", { base64: item["attachments"]}, "image/jpg" );
            // await file.save();

            // let result = await new ScheduleActionEmail().do(
            //     {
            //         to: ["tulip.lin@isapsolution.com"],
            //         subject: "subject",
            //         body: "body",
            //         // attachments: [file]
            //     });

            // 7.0 Database disconnect
            this.mongoClient.close();
        }

        now = new Date();
        var s = (now.getMinutes() * 60 + now.getSeconds()) % this.cycleTime;
        Log.Info(`${this.constructor.name}`, `Timer Check wait for [ ${this.cycleTime - s} ] sec`);

        this.waitTimer = setTimeout(() => {
            this.doAccessControlSync();
        }, (this.cycleTime - s) * 1000);
    }
}

export default new ACSService();
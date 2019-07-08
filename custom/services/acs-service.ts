import { Config } from 'core/config.gen';
import { Log } from 'helpers/utility';

import { ScheduleActionEmail } from 'core/scheduler-loader';

import * as delay from 'delay';

import { Reader, Door, Floor, Elevator, Member, TimeSchedule, AccessLevel, PermissionTable, WorkGroup, DoorGroup } from '../../custom/models'
import { siPassAdapter, cCureAdapter } from './acsAdapter-Manager';

export class ACSService {
    private waitTimer = null;
    private startDelayTime: number = 5 // sec
    private cycleTime: number = 1200; // sec

    constructor() {
        var me = this;

        // 1.0 Login to Datebase
        Log.Info(`${this.constructor.name}`, `1.0 Login database connection`);
        // (async () => {
            me.waitTimer = setTimeout(async () => {
                me.doAccessControlSync();
            }, 1000 * me.startDelayTime);
        // })();
    }

    async doAccessControlSync() {
        Log.Info(`${this.constructor.name}`, `2.0 Timer Check`);

        var me = this;
        let now: Date = new Date();

        clearTimeout(this.waitTimer);

        let siPassSessionId = siPassAdapter.sessionToken;
        Log.Info(`${this.constructor.name}`, ` SiPass SessionToken ${siPassSessionId}`);
        Log.Info(`${this.constructor.name}`, ` getHours ${now.getHours()} getMinutes ${now.getMinutes()}`);

        // if ((now.getHours() == 0) && (now.getMinutes() == 0)) {  // Startup @00:00
        if (now.getMinutes() != 70) {
            // 0.0 Initial Adapter
            Log.Info(`${this.constructor.name}`, `0.0 Initial Adapter`);

            let obj: any;
            if (siPassSessionId != "") {
                Log.Info(`${this.constructor.name}`, `SiPass 2.2 Time Schedule`);
                {
                    let records = await siPassAdapter.getTimeSchedule();
                    console.log("Time Schedule", records);

                    if (records) {
                        for (let idx = 0; idx < records.length; idx++) {
                            const r = records[idx];

                            Log.Info(`${this.constructor.name}`, `Import data SiPass TimeSchedule ${r["Name"]}-${r["Token"]}`);

                            obj = await new Parse.Query(TimeSchedule).equalTo("timeid", r["Token"]).first();
                            if (obj == null) {
                                let d = {
                                    system: 1,
                                    timeid: r["Token"],
                                    timename: r["Name"],
                                    status: 1
                                };
                                let o = new TimeSchedule(d);
                                await o.save();
                            }
                            else {
                                obj.set("system", 1);
                                obj.set("timeid", r["Token"]);
                                obj.set("timename", r["Name"]);

                                obj.save();
                            }
                            // await this.mongoDb.collection("TimeSchedule").findOneAndUpdate({ "timeid": r["Token"] }, { $set: d }, { upsert: true });
                        };
                    }
                }
                await delay(1000);

                Log.Info(`${this.constructor.name}`, `SiPass 2.3 Door Readers`);
                {
                    let records = await siPassAdapter.getReaders();
                    console.log("Readers", records);

                    if (records) {
                        for (let idx = 0; idx < records.length; idx++) {
                            const r = records[idx];
                            
                            Log.Info(`${this.constructor.name}`, `Import data SiPass Reader ${r["Name"]}-${r["Token"]}`);

                            obj = await new Parse.Query(Reader).equalTo("readerid", r["Token"]).first();
                            if (obj == null) {
                                let d = {
                                    system: 1,
                                    readerid: r["Token"],
                                    readername: r["Name"],
                                    status: 1
                                };

                                let o = new Reader(d);
                                await o.save();
                            }
                            else {
                                obj.set("system", 1);
                                obj.set("readerid", r["Token"]);
                                obj.set("readername", r["Name"]);

                                obj.save();
                            }
                            // await this.mongoDb.collection("Reader").findOneAndUpdate({ "readerid": r["Token"] }, { $set: d }, { upsert: true });
                        };
                    }
                }
                await delay(1000);

                // Log.Info(`${this.constructor.name}`, `SiPass 2.4 Doors`);
                // {
                //     let records = await siPassAdapter.getDoors();
                //     console.log("Doors", records);

                //     if (records) {
                //         for (let idx = 0; idx < records.length; idx++) {
                //             const r = records[idx];

                //             Log.Info(`${this.constructor.name}`, `Import data SiPass Door ${r["Name"]}-${r["Token"]}`);

                //             obj = await new Parse.Query(Door).equalTo("doorid", +r["Token"]).first();
                //             if (obj == null) {
                //                 let d = {
                //                     system: 1,
                //                     doorid: +r["Token"],
                //                     doorname: r["Name"],
                //                     status: 1
                //                 };
                //                 let o = new Door(d);
                //                 await o.save();
                //             }
                //             else {
                //                 obj.set("system", 1);
                //                 obj.set("doorid", +r["Token"]);
                //                 obj.set("doorname", r["Name"]);

                //                 obj.save();
                //             }
                //             // await this.mongoDb.collection("Door").findOneAndUpdate({ "doorid": +r["Token"] }, { $set: d }, { upsert: true });
                //         };
                //     }
                // }
                // await delay(1000);

                Log.Info(`${this.constructor.name}`, `SiPass 2.5 Floors`);
                {
                    let records = await siPassAdapter.getFloors();
                    console.log("Floors", records);

                    if (records) {
                        for (let idx = 0; idx < records.length; idx++) {
                            const r = records[idx];
                            
                            Log.Info(`${this.constructor.name}`, `Import data SiPass FloorPoints ${r["Name"]}-${r["Token"]}`);

                            obj = await new Parse.Query(Floor).equalTo("floorid", r["Token"]).first();

                            if (obj == null) {
                                let d = {
                                    system: 1,
                                    floorid: r["Token"],
                                    floorname: r["Name"],
                                    status: 1
                                };
                                let o = new Floor(d);
                                let o1 = await o.save();
                            }
                            else {
                                obj.set("system", 1);
                                obj.set("floorid", r["Token"]);
                                obj.set("floorname", r["Name"]);
                                obj.save();
                            }
                            // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
                        }
                    }
                }
                await delay(1000);

                // Log.Info(`${this.constructor.name}`, `SiPass 2.6 Elevators`);
                // {
                //     let records = await siPassAdapter.getElevators();

                //     console.log("Elevators", records);

                //     if (records) {
                //         for (let idx = 0; idx < records.length; idx++) {
                //             const r = records[idx];

                //             Log.Info(`${this.constructor.name}`, `Import data SiPass FloorPoints ${r["Name"]}-${r["Token"]}`);

                //             obj = await new Parse.Query(Elevator).equalTo("elevatorid", r["Token"]).first();
                //             if (obj == null) {
                //                 let d = {
                //                     system: 1,
                //                     elevatorid: r["Token"],
                //                     elevatorname: r["Name"],
                //                     status: 1
                //                 };
                //                 let o = new Elevator(d);
                //                 await o.save();
                //             }
                //             else {
                //                 obj.set("system", 1);
                //                 obj.set("elevatorid", r["Token"]);
                //                 obj.set("elevatorname", r["Name"]);

                //                 obj.save();
                //             }
                //             // await this.mongoDb.collection("Elevator").findOneAndUpdate({ "elevatorid": r["Token"] }, { $set: d }, { upsert: true });
                //         }
                //     }
                // }

                Log.Info(`${this.constructor.name}`, `SiPass 2.7 Access Group List`);
                {
                    let readers = await new Parse.Query(Reader).find() ;

                    let grouplist = await siPassAdapter.getAccessGroupList();
                    console.log("Access Group List", grouplist);

                    if (grouplist) {
                        for (let i = 0; i < grouplist.length; i++) {
                            Log.Info(`${this.constructor.name}`, `Import data SiPass AccessGroups ${grouplist[i]["Name"]}-${grouplist[i]["Token"]}`);

                            let group = await siPassAdapter.getAccessGroup(grouplist[i]["Token"]);

                            let acl = [];
                            console.log("Access Group", group);

                            if (group) {
                                for (let j = 0; j < group["AccessLevels"].length; j++) {
                                    Log.Info(`${this.constructor.name}`, `Import data SiPass AccessLevels ${group["AccessLevels"][j]["Name"]}-${group["AccessLevels"][j]["Token"]}`);

                                    let level = await siPassAdapter.getAccessLevel(group["AccessLevels"][j]["Token"]);

                                    obj = await new Parse.Query(TimeSchedule).equalTo("timeid", level["TimeScheduleToken"]).first();
                                    let tsid = obj.id;

                                    let rs = [];
                                    for (let idx1 = 0; idx1 < level["AccessRule"].length; idx1++) {
                                        let rule = level["AccessRule"][idx1];
                                        for (let idx2 = 0; idx2 < readers.length; idx2++) {
                                            const r = readers[idx2] as Reader;

                                            if (r.get("readerid") == rule["ObjectToken"]) {
                                                //rs.push(r["_id"]);
                                                rs.push(r);
                                                break;
                                            }
                                        }
                                    };

                                    let lev = await new Parse.Query(AccessLevel).equalTo("levelname", level["Name"]).first();
                                    if (lev == null) {
                                        let d = {
                                            system: 1,
                                            levelid: level["Token"],
                                            levelname: level["Name"],
                                            status: 1,
                                            reader: rs,
                                            timeschedule: obj
                                        };
                                        let o = new AccessLevel(d);
                                        lev = await o.save();
                                    }
                                    else {
                                        obj.set("system", 1);
                                        obj.set("levelid", level["Token"]);
                                        obj.set("levelname", level["Name"]);
                                        obj.set("reader", rs);
                                        obj.set("timeschedule", obj);
                                    }

                                    // let lev = await this.mongoDb.collection("AccessLevel").findOneAndUpdate({ "levelname": level["Name"] }, { $set: d }, { upsert: true, returnOriginal: false });
                                    // let o = new AccessLevel(d);
                                    // let lev = await o.save();
                                    // acl.push(lev.value.id);
                                    acl.push(lev);
                                    await delay(1000);
                                }
                            }
                            obj = await new Parse.Query(PermissionTable).equalTo("tablename", group["Name"]).first();
                            if (obj == null) {
                                let d = {
                                    system: 1,
                                    tableid: group["Token"],
                                    tablename: group["Name"],
                                    status: 1,
                                    accesslevels: acl
                                };
                                let o = new PermissionTable(d);
                                await o.save();
                            }
                            else {
                                obj.set("system", 1);
                                obj.set("tableid", group["Token"]);
                                obj.set("tablename", group["Name"]);
                                obj.set("accesslevels", acl);
                                obj.save();
                            }
                            // await this.mongoDb.collection("PermissionTable").findOneAndUpdate({ "tablename": group["Name"] }, { $set: d }, { upsert: true });
                            await delay(1000);
                        }
                    }
                }
                await delay(1000);

                Log.Info(`${this.constructor.name}`, `SiPass 2.8 Work Group List`);
                {
                    let grouplist = await siPassAdapter.getWorkGroupList();
                    console.log("Work Group List", grouplist);

                    if (grouplist) {
                        for (let idx = 0; idx < grouplist.length; idx++) {

                            Log.Info(`${this.constructor.name}`, `Import data SiPass WorkGroup ${grouplist[idx]["Name"]}-${grouplist[idx]["Token"]}`);

                            let group = await siPassAdapter.getWorkGroup(grouplist[idx]["Token"]);

                            obj = await new Parse.Query(WorkGroup).equalTo("groupid", group["Token"]).first();
                            if (obj == null) {
                                let d = {
                                    system: 1,
                                    groupid: group["Token"],
                                    groupname: group["Name"],
                                    type: +group["Type"],
                                    accesspolicyrules: group["AccessPolicyRules"],
                                    status: 1
                                };
                                let o = new WorkGroup(d);
                                await o.save();
                            }
                            else {
                                obj.set("system", 1);
                                obj.set("groupid", group["Token"]);
                                obj.set("groupname", group["Name"]);
                                obj.set("type", +group["Type"]);
                                obj.set("accesspolicyrules", group["AccessPolicyRules"]);
                                obj.save();
                            }
                            // await this.mongoDb.collection("WorkGroup").findOneAndUpdate({ "groupid": group["Token"] }, { $set: d }, { upsert: true });
                        }
                    }
                }
                await delay(1000);

                Log.Info(`${this.constructor.name}`, `SiPass 2.9 Get Card Holder List`);
                {
                    let grouplist = await siPassAdapter.getCardHolderList();
                    console.log("Card Holder List", grouplist);

                    if (grouplist) {

                        for (let idx = 0; idx < grouplist.length; idx++) {
                            Log.Info(`${this.constructor.name}`, `Import data SiPass Cardholders ${grouplist[idx]["Name"]}-${grouplist[idx]["Token"]}`);

                            let holder = await siPassAdapter.getCardHolder(grouplist[idx]["Token"]);

                            obj = await new Parse.Query(Member).equalTo("Token", holder["Token"]).first();
                            if (obj == null) {
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
                                    NonPartitionWorkgroupAccessRules: holder["NonPartitionWorkgroupAccessRules"],
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
                                    FingerPrints: holder["FingerPrints"],
                                    CardholderPortrait: holder["CardholderPortrait"]
                                }
                                let o = new Member(d);
                                await o.save();
                            }
                            else {
                                obj.set("system", 1);
                                obj.set("Attributes", holder["Attributes"]);
                                obj.set("Credentials", holder["Credentials"]);
                                obj.set("AccessRules", holder["AccessRules"]);
                                obj.set("EmployeeNumber", holder["EmployeeNumber"]);
                                obj.set("EndDate", holder["EndDate"]);
                                obj.set("FirstName", holder["FirstName"]);
                                obj.set("GeneralInformation", holder["GeneralInformation"]);
                                obj.set("LastName", holder["LastName"]);
                                obj.set("PersonalDetails", holder["PersonalDetails"]);
                                obj.set("PrimaryWorkgroupId", holder["PrimaryWorkgroupId"]);

                                obj.set("ApbWorkgroupId", holder["ApbWorkgroupId"]);
                                obj.set("PrimaryWorkgroupName", holder["PrimaryWorkgroupName"]);
                                obj.set("NonPartitionWorkGroups", holder["NonPartitionWorkGroups"]);
                                obj.set("SmartCardProfileId", holder["SmartCardProfileId"]);
                                obj.set("StartDate", holder["StartDate"]);
                                obj.set("Status", holder["Status"]);
                                obj.set("Token", holder["Token"]);
                                obj.set("TraceDetails", holder["TraceDetails"]);
                                obj.set("Vehicle1", holder["Vehicle1"]);
                                obj.set("Vehicle2", holder["Vehicle2"]);

                                obj.set("Potrait", holder["Potrait"]);
                                obj.set("PrimaryWorkGroupAccessRule", holder["PrimaryWorkGroupAccessRule"]);
                                obj.set("NonPartitionWorkgroupAccessRules", holder["NonPartitionWorkgroupAccessRules"]);
                                obj.set("VisitorDetails", holder["VisitorDetails"]);

                                obj.set("CustomFields", holder["CustomFields"]);
                                obj.set("FingerPrints", holder["FingerPrints"]);
                                obj.set("CardholderPortrait", holder["CardholderPortrait"]);
                                obj.save();
                            }

                            // await this.mongoDb.collection("Member").findOneAndUpdate({ "Token": d["Token"] }, { $set: d }, { upsert: true });
                            await delay(200);
                        }
                    }
                }
                await delay(1000);
            }

            // 3.0 get data from CCure800
            {
                Log.Info(`${this.constructor.name}`, `CCure 2.2 Time Schedule`); 
                {
                    let records = await cCureAdapter.getTimeSchedule()
                    console.log("Time Schedule", records);

                    if ( records) {
                        for (let idx = 0; idx < records.length; idx++) {
                            const r = records[idx];

                            Log.Info(`${this.constructor.name}`, `Import data CCURE800 TimeSchedule ${r["timespecName"]}-${r["timespecId"]}`);

                            obj = await new Parse.Query(TimeSchedule).equalTo("timeid", r["timespecId"]).first();
                            if (obj == null) {
                                let d = {
                                    system: 2,
                                    timeid: r["timespecId"],
                                    timename: r["timespecName"],
                                    status: 1
                                };
                                let o = new TimeSchedule(d);
                                await o.save();
                            }
                            else {
                                obj.set("timeid", r["timespecId"]);
                                obj.set("timename", r["timespecName"]);

                                obj.save();
                            }
                        };
                    }
                }
                await delay(1000);

                Log.Info(`${this.constructor.name}`, `CCure 2.3 Doors`);
                {
                    let records = await cCureAdapter.getDoors();
                    console.log("Doors", records);

                    if (records) {
                        for (let idx = 0; idx < records.length; idx++) {
                            const r = records[idx];

                            Log.Info(`${this.constructor.name}`, `Import data CCURE800 Doors ${r["doorName"]}-${r["doorId"]}`);

                            obj = await new Parse.Query(Door).equalTo("doorid", +r["doorId"]).first();
                            if (obj == null) {
                                let d = {
                                    system: 2,
                                    doorid: +r["doorId"],
                                    doorname: r["doorName"],
                                    status: 1
                                };
                                let o = new Door(d);
                                await o.save();
                            }
                            else {
                                obj.set("doorid", +r["doorId"]);
                                obj.set("doorname", r["doorName"]);

                                obj.save();
                            }
                        };
                    }
                }
                await delay(1000);

                Log.Info(`${this.constructor.name}`, `CCure 2.4 Door Groups`);
                {
                    let records = await cCureAdapter.getDoorGroups();
                    console.log("DoorGroups", records);

                    if (records) {
                        for (let idx = 0; idx < records.length; idx++) {
                            const r = records[idx];

                            Log.Info(`${this.constructor.name}`, `Import data CCURE800 DoorGroups ${r["floorName"]}-${r["floorId"]}`);

                            obj = await new Parse.Query(DoorGroup).equalTo("groupid", +r["floorId"]).first();
                            if (obj == null) {
                                let d = {
                                    system: 2,
                                    groupid: +r["floorId"],
                                    groupname: r["floorName"],
                                    status: 1
                                };
                                let o = new DoorGroup(d);
                                await o.save();
                            }
                            else {
                                obj.set("groupid", +r["floorId"]);
                                obj.set("groupname", r["floorName"]);

                                obj.save();
                            }
                        };
                    }
                }
                await delay(1000);

                Log.Info(`${this.constructor.name}`, `CCure 2.5 Door Readers`);
                {
                    let records = await cCureAdapter.getReaders();
                    console.log("Readers", records);

                    if (records) {
                        for (let idx = 0; idx < records.length; idx++) {
                            const r = records[idx];

                            Log.Info(`${this.constructor.name}`, `Import data CCURE800 Readers ${r["deviceName"]}-${r["deviceId"]}`);

                            obj = await new Parse.Query(Reader).equalTo("readerid", r["deviceId"]).first();
                            if (obj == null) {
                                let d = {
                                    system: 1,
                                    readerid: r["deviceId"],
                                    readername: r["deviceName"],
                                    status: 1
                                };

                                obj = new Reader(d);
                                await obj.save();
                            }
                            else {
                                obj.set("readerid", r["deviceId"]);
                                obj.set("readername", r["deviceName"]);

                                obj.save();
                            }

                            let door = await new Parse.Query(Door).equalTo("doorid", +r["doorId"]).first();
                            if (door) {
                                let readers = door.get("readerin");
                                    readers.push(obj);
                                door.set("readerin", readers);
                            }
                        };
                    }
                }
                await delay(1000);

                Log.Info(`${this.constructor.name}`, `CCure 2.6 Floors`);
                {
                    let records = await cCureAdapter.getFloors();
                    console.log("Floors", records);

                    if (records) {
                        for (let idx = 0; idx < records.length; idx++) {
                            const r = records[idx];

                            Log.Info(`${this.constructor.name}`, `Import data CCURE800 Floors ${r["floorName"]}-${r["floorId"]}`);

                            obj = await new Parse.Query(Floor).equalTo("floorid", r["Token"]).first();

                            if (obj == null) {
                                let d = {
                                    system: 1,
                                    floorid: r["floorId"],
                                    floorname: r["floorName"],
                                    status: 1
                                };
                                let o = new Floor(d);
                                let o1 = await o.save();
                            }
                            else {
                                obj.set("floorid", r["floorId"]);
                                obj.set("floorname", r["floorName"]);
                                obj.save();
                            }
                            // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
                        }
                    }
                }
                await delay(1000);

                Log.Info(`${this.constructor.name}`, `CCure 2.7 Elevators`);
                {
                    let records = await cCureAdapter.getElevators();
                    console.log("Elevators", records);

                    if (records) {
                        for (let idx = 0; idx < records.length; idx++) {
                            const r = records[idx];

                            Log.Info(`${this.constructor.name}`, `Import data CCURE800 Elevators ${r["elevatorName"]}-${r["elevatorId"]}`);

                            obj = await new Parse.Query(Elevator).equalTo("elevatorid", r["elevatorId"]).first();

                            if (obj == null) {
                                let d = {
                                    system: 1,
                                    elevatorid: r["elevatorId"],
                                    elevatorname: r["elevatorName"],
                                    status: 1
                                };
                                let o = new Elevator(d);
                                let o1 = await o.save();
                            }
                            else {
                                obj.set("elevatorid", r["elevatorId"]);
                                obj.set("elevatorname", r["elevatorName"]);
                                obj.save();
                            }
                            // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
                        }
                    }
                }
                await delay(1000);

                Log.Info(`${this.constructor.name}`, `CCure 2.8 PermissionTables`);
                {
                    let records = await cCureAdapter.getPermissionTables();
                    console.log("PermissionTables", records);

                    if (records) {
                        for (let idx = 0; idx < records.length; idx++) {
                            const r = records[idx];

                            Log.Info(`${this.constructor.name}`, `Import data CCURE800 PermissionTables ${r["permissionTableName"]}-${r["permissionTableId"]}`);

                            obj = await new Parse.Query(PermissionTable).equalTo("elevatorid", r["elevatorId"]).first();

                            if (obj == null) {
                                let d = {
                                    system: 1,
                                    tableid: r["permissionTableId"],
                                    tablename: r["permissionTableName"],
                                    status: 1
                                };
                                let o = new PermissionTable(d);
                                let o1 = await o.save();
                            }
                            else {
                                obj.set("tableid", r["permissionTableId"]);
                                obj.set("tablename", r["permissionTableName"]);
                                obj.save();
                            }
                            // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
                        }
                    }
                }
                await delay(1000);

                Log.Info(`${this.constructor.name}`, `CCure 2.8 CardHolderList`);
                {
                    let records = await cCureAdapter.getCardHolderList();
                    console.log("CardHolderList", records);

                    if (records) {
                        for (let idx = 0; idx < records.length; idx++) {
                            const r = records[idx];

                            Log.Info(`${this.constructor.name}`, `Import data CCURE800 CardHolderList ${r["lastName"]}-${r["employeeNo"]}`);

                            obj = await new Parse.Query(Member).equalTo("elevatorid", r["employeeNo"]).first();

                            if (obj == null) {
                                let d = {
                                    system: 1,
                                    EmployeeNumber: r["employeeNo"],
                                    status: 1
                                };
                                let o = new Member(d);
                                let o1 = await o.save();
                            }
                            else {
                                obj.set("EmployeeNumber", r["employeeNo"]);
                                obj.save();
                            }
                            // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
                        }
                    }
                }
                await delay(1000);
            }
            



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
            // this.mongoClient.close();
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
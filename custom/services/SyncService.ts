import { Log } from 'helpers/utility';
import * as delay from 'delay';

import { Reader, Door, Floor, Elevator, Member, TimeSchedule, AccessLevel, PermissionTable, WorkGroup, DoorGroup, CredentialProfiles, PermissionTableDoor } from '../../custom/models'
import { siPassAdapter, cCureAdapter } from './acsAdapter-Manager';

export class SyncService{
     async syncCcurePermissionTable() {
        Log.Info(`${this.constructor.name}`, `CCure 2.8 PermissionTables`);
        let records = await cCureAdapter.getPermissionTables();
        console.log("PermissionTables", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {

                const r = records[idx];
                if (!r["permissionTableId"] || !r["permissionTableName"]) continue;
                Log.Info(`${this.constructor.name}`, `Import data CCURE800 PermissionTables ${r["permissionTableName"]}-${r["permissionTableId"]}`);
                let obj = await new Parse.Query(PermissionTable)
                    .equalTo("tableid", parseInt(r["permissionTableId"]))
                    .equalTo("system", 800)
                    .first();
                if (obj == null) {
                    let d = {
                        system: 800,
                        tableid: +r["permissionTableId"],
                        tablename: r["permissionTableName"],
                        status: 1
                    };
                    let o = new PermissionTable(d);
                    if (!d.tableid || isNaN(d.tableid)) continue;
                    let o1 = await o.save();
                }
                else {
                    obj.set("system", 800);
                    obj.set("tableid", +r["permissionTableId"]);
                    obj.set("tablename", r["permissionTableName"]);
                    await obj.save();
                }
                // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
            }
        }
        await delay(1000);
    }

     async syncCcurePermissionTableDoor() {
        Log.Info(`${this.constructor.name}`, `CCure 2.6 syncCcurePermissionTableDoor`);
        let records = await cCureAdapter.GetAllPermissionTableDoor();

        /*
        [
            { 
                permissionTableId: 5179, 
                doorId: 113956, 
                timespecId: 1682 
            },
            { 
                permissionTableId: 5182, 
                doorId: 5441, 
                timespecId: 5209 
            }
        ]
        */

        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data CCURE800 PermissionTableDoor ${r["permissionTableId"]}-${r["doorId"]}`);
                let obj = await new Parse.Query(PermissionTableDoor)
                    .equalTo("permissionTableId", parseInt(r["permissionTableId"]))
                    .first();
                if (obj == null) {
                    let d = {
                        system: 800,
                        permissionTableId: +r["permissionTableId"],
                        doorId: [r["doorId"]],
                        timespecId: r["timespecId"],
                        status: 1
                    };
                    let o = new PermissionTableDoor(d);
                    let o1 = await o.save();
                }
                else {
                    let d1 = obj.get("doorId") as number[] ;
                    let d2 = +r["doorId"] ;

                    if ( d1.indexOf(d2) < 0)
                        d1.push(d2);

                    obj.set("system", 800);
                    obj.set("permissionTableId", +r["permissionTableId"]);
                    obj.set("doorId", d1);
                    obj.set("timespecId", r["timespecId"]);
                    await obj.save();
                }
                // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
            }
        }
        await delay(1000);
    }

     async syncCcureFloor() {
        Log.Info(`${this.constructor.name}`, `CCure 2.6 Floors`);
        let records = await cCureAdapter.getFloors();
        console.log("Floors", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data CCURE800 Floors ${r["floorName"]}-${r["floorId"]}`);
                let obj = await new Parse.Query(Floor)
                    .equalTo("floorId", +r["floorId"])
                    .equalTo("system", 800)
                    .first();
                if (obj == null) {
                    let d = {
                        system: 800,
                        floorid: +r["floorId"],
                        floorname: r["floorName"],
                        status: 1
                    };
                    let o = new Floor(d);
                    let o1 = await o.save();
                }
                else {
                    obj.set("system", 800);
                    obj.set("floorid", +r["floorId"]);
                    obj.set("floorname", r["floorName"]);
                    await obj.save();
                }
                // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
            }
        }
        await delay(1000);
    }

     async syncCcureDoorReader() {
        Log.Info(`${this.constructor.name}`, `CCure 2.5 Door Readers`);
        let records = await cCureAdapter.getReaders();
        console.log("Readers", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data CCURE800 Readers ${r["deviceName"]}-${r["deviceId"]}`);
                let obj = await new Parse.Query(Reader)
                    .equalTo("readerid", r["deviceId"])
                    .equalTo("system", 800)
                    .first();
                if (obj == null) {
                    let d = {
                        system: 800,
                        readerid: r["deviceId"],
                        readername: r["deviceName"],
                        status: 1
                    };
                    obj = new Reader(d);
                    await obj.save();
                }
                else {
                    obj.set("system", 800);
                    obj.set("readerid", r["deviceId"]);
                    obj.set("readername", r["deviceName"]);
                    await obj.save();
                }
                let door = await new Parse.Query(Door).equalTo("doorid", +r["doorId"]).first();
                if (door) {
                    let readers = door.get("readerin");
                    if (readers)
                        readers.push(obj);
                    else
                        readers = [obj];
                    door.set("readerin", readers);
                }
            }
            ;
        }
        await delay(1000);
    }

     async syncCcureDoor() {
        Log.Info(`${this.constructor.name}`, `CCure 2.3 Doors`);
        let records = await cCureAdapter.getDoors();
        console.log("Doors", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data CCURE800 Doors ${r["doorName"]}-${r["doorId"]}`);
                let obj = await new Parse.Query(Door)
                    .equalTo("doorid", r["doorId"])
                    .equalTo("system", 800)
                    .first();
                if (obj == null) {
                    let d = {
                        system: 800,
                        doorid: +r["doorId"],
                        doorname: r["doorName"],
                        status: 1
                    };
                    let o = new Door(d);
                    await o.save();
                }
                else {
                    obj.set("system", 800);
                    obj.set("doorid", +r["doorId"]);
                    obj.set("doorname", r["doorName"]);
                    await obj.save();
                }
            }
            ;
        }
        await delay(1000);
    }

     async syncCcureTimeSchedule() {
        Log.Info(`${this.constructor.name}`, `CCure 2.2 Time Schedule`);
        let records = await cCureAdapter.getTimeSchedule();
        console.log("Time Schedule", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data CCURE800 TimeSchedule ${r["timespecName"]}-${r["timespecId"]}`);
                let obj = await new Parse.Query(TimeSchedule)
                    .equalTo("timeid", r["timespecId"])
                    .equalTo("system", 800)
                    .first();
                if (obj == null) {
                    let d = {
                        system: 800,
                        timeid: +r["timespecId"],
                        timename: r["timespecName"],
                        status: 1
                    };
                    let o = new TimeSchedule(d);
                    await o.save();
                }
                else {
                    obj.set("system", 800);
                    obj.set("timeid", +r["timespecId"]);
                    obj.set("timename", r["timespecName"]);
                    await obj.save();
                }
            }
            ;
        }
        await delay(1000);
    }
    async syncSipassReader() {
        Log.Info(`CGI acsSync`, `SiPass 2.3 Door Readers`);
        
        let records = await siPassAdapter.getReaders();
        //console.log("Readers", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`CGI acsSync`, `Import data SiPass Reader ${r["Name"]}-${r["Token"]}`);
                let obj = await new Parse.Query(Reader)
                            .equalTo("readerid", parseInt(r["Token"]))
                            .first();
                if (obj == null) {
                    let d = {
                        system: 1,
                        readerid: parseInt(r["Token"]),
                        readername: r["Name"],
                        status: 1
                    };
                    let o = new Reader(d);
                    await o.save();
                }
                else {
                    obj.set("system", 1);
                    obj.set("readerid", parseInt(r["Token"]));
                    obj.set("readername", r["Name"]);
                    obj.save();
                }
                // await this.mongoDb.collection("Reader").findOneAndUpdate({ "readerid": r["Token"] }, { $set: d }, { upsert: true });
            }
            ;
        }
        
        await delay(1000);
    }
     async syncSipassCredentialProfile() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.9 Get All Credential Profiles`);
        let records = await siPassAdapter.getAllCredentialProfiles();
        console.log("Readers", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data SiPass CredentialProfiles ${r["Name"]}-${r["Token"]}`);
                let obj = await new Parse.Query(CredentialProfiles)
                    .equalTo("Token", r["Token"])
                    .first();
                if (obj == null) {
                    let o = new CredentialProfiles(r);
                    await o.save();
                }
            }
            ;
        }
        await delay(1000);
    }

     async syncSipassWorkgroup() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.8 Work Group List`);
        let grouplist = await siPassAdapter.getWorkGroupList();
        console.log("Work Group List", grouplist);
        if (grouplist) {
            for (let idx = 0; idx < grouplist.length; idx++) {
                Log.Info(`${this.constructor.name}`, `Import data SiPass WorkGroup ${grouplist[idx]["Name"]}-${grouplist[idx]["Token"]}`);
                let group = await siPassAdapter.getWorkGroup(grouplist[idx]["Token"]);
                let obj = await new Parse.Query(WorkGroup)
                    .equalTo("groupid", group["Token"])
                    .equalTo("system", 1)
                    .first();
                if (obj == null) {
                    let d = {
                        system: 1,
                        groupid: +group["Token"],
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
                    obj.set("groupid", +group["Token"]);
                    obj.set("groupname", group["Name"]);
                    obj.set("type", +group["Type"]);
                    obj.set("accesspolicyrules", group["AccessPolicyRules"]);
                    await obj.save();
                }
                // await this.mongoDb.collection("WorkGroup").findOneAndUpdate({ "groupid": group["Token"] }, { $set: d }, { upsert: true });
            }
        }
        await delay(1000);
    }

     async syncSipassAcessGroup() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.7 Access Group List`);

        let readers = await new Parse.Query(Reader).find();

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

                        let obj = await new Parse.Query(TimeSchedule)
                                    .equalTo("timeid", +level["TimeScheduleToken"])
                                    .first();
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

                        let lev = await new Parse.Query(AccessLevel)
                            .equalTo("levelname", level["Name"])
                            .equalTo("system", 1)
                            .first();
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
                            obj.set("levelid", +level["Token"]);
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
                let obj = await new Parse.Query(PermissionTable)
                    .equalTo("tablename", group["Name"])
                    .equalTo("system", 1)
                    .first();
                if (obj == null) {
                    let d = {
                        system: 1,
                        tableid: +group["Token"],
                        tablename: group["Name"],
                        status: 1,
                        accesslevels: acl
                    };
                    let o = new PermissionTable(d);
                    await o.save();
                }
                else {
                    obj.set("system", 1);
                    obj.set("tableid", +group["Token"]);
                    obj.set("tablename", group["Name"]);
                    obj.set("accesslevels", acl);
                    await obj.save();
                }
                // await this.mongoDb.collection("PermissionTable").findOneAndUpdate({ "tablename": group["Name"] }, { $set: d }, { upsert: true });
                await delay(1000);
            }
        }

        await delay(1000);
    }

     async syncSipassFloor() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.5 Floors`);
        let records = await siPassAdapter.getFloors();
        console.log("Floors", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data SiPass FloorPoints ${r["Name"]}-${r["Token"]}`);
                let obj = await new Parse.Query(Floor)
                    .equalTo("floorid",+r["Token"])
                    .equalTo("system", 1)
                    .first();
                if (obj == null) {
                    let d = {
                        system: 1,
                        floorid: +r["Token"],
                        floorname: r["Name"],
                        status: 1
                    };
                    let o = new Floor(d);
                    let o1 = await o.save();
                }
                else {
                    obj.set("system", 1);
                    obj.set("floorid", +r["Token"]);
                    obj.set("floorname", r["Name"]);
                    await obj.save();
                }
                // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
            }
        }
        await delay(1000);
    }

     async syncSipassDoorReader() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.3 Door Readers`);
        let records = await siPassAdapter.getReaders();
        console.log("Readers", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data SiPass Reader ${r["Name"]}-${r["Token"]}`);
                let obj = await new Parse.Query(Reader)
                    .equalTo("readerid", +r["Token"])
                    .equalTo("system", 1)
                    .first();
                if (obj == null) {
                    let d = {
                        system: 1,
                        readerid: +r["Token"],
                        readername: r["Name"],
                        status: 1
                    };
                    let o = new Reader(d);
                    await o.save();
                }
                else {
                    obj.set("system", 1);
                    obj.set("readerid", +r["Token"]);
                    obj.set("readername", r["Name"]);
                    await obj.save();
                }
                // await this.mongoDb.collection("Reader").findOneAndUpdate({ "readerid": r["Token"] }, { $set: d }, { upsert: true });
            }
            ;
        }
        await delay(1000);
    }

     async syncSipassSchedule() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.2 Time Schedule`);
        let records = await siPassAdapter.getTimeSchedule();
        console.log("Time Schedule", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data SiPass TimeSchedule ${r["Name"]}-${r["Token"]}`);
                let obj = await new Parse.Query(TimeSchedule)
                    .equalTo("timename", r["Name"])
                    .equalTo("system", 1)
                    .first();
                if (obj == null) {
                    let d = {
                        system: 1,
                        timeid: +r["Token"],
                        timename: r["Name"],
                        status: 1
                    };
                    let o = new TimeSchedule(d);
                    await o.save();
                }
                else {
                    obj.set("system", 1);
                    obj.set("timeid", +r["Token"]);
                    obj.set("timename", r["Name"]);
                    await obj.save();
                }
                // await this.mongoDb.collection("TimeSchedule").findOneAndUpdate({ "timeid": r["Token"] }, { $set: d }, { upsert: true });
            }
            ;
        }
        await delay(1000);
    }
}

export default new SyncService();
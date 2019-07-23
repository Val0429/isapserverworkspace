import { Config } from 'core/config.gen';
import { Log } from 'helpers/utility';

import { ScheduleActionEmail } from 'core/scheduler-loader';

import * as delay from 'delay';

import { Reader, Door, Floor, Elevator, Member, TimeSchedule, AccessLevel, PermissionTable, WorkGroup, DoorGroup, CredentialProfiles } from '../../custom/models'
import { siPassAdapter, cCureAdapter } from './acsAdapter-Manager';

export class ACSService {
    private waitTimer = null;
    private startDelayTime: number = 5 // sec
    private cycleTime: number = 1200; // sec

    constructor() {

        this.startSync();
        // 1.0 Login to Datebase
        Log.Info(`${this.constructor.name}`, `1.0 Login database connection`);
        // (async () => {
        this.waitTimer = setTimeout(async () => {
            this.doAccessControlSync();
        }, 1000 * this.startDelayTime);
        // })();
    }

    async doAccessControlSync() {
        Log.Info(`${this.constructor.name}`, `2.0 Timer Check`);

        let now: Date = new Date();

        clearTimeout(this.waitTimer);
        this.cycleTime = 1200;

        if (this.cycleTime != 5) {
            if ((now.getHours() == 0) && (now.getMinutes() == 0)) {  // Startup @00:00
                // if (now.getMinutes() != 70) {
                // 0.0 Initial Adapter
                Log.Info(`${this.constructor.name}`, `0.0 Initial Adapter`);
                await this.startSync();
            }
        }

        now = new Date();
        var s = (now.getMinutes() * 60 + now.getSeconds()) % this.cycleTime;
        Log.Info(`${this.constructor.name}`, `Timer Check wait for [ ${this.cycleTime - s} ] sec`);

        this.waitTimer = setTimeout(() => {
            this.doAccessControlSync();
        }, (this.cycleTime - s) * 1000);
    }

    private async startSync() {
        let me = this;
        await new Promise(async function (resolve, reject) {
            await me.syncSipassSchedule();
            resolve();
        });

        await Promise.all([
            this.syncSipassDoorReader(),
            this.syncSipassFloor(),
            //this.syncSipassAcessGroup(),
            this.syncSipassWorkgroup(),
            this.syncSipassCredentialProfile(),

            this.syncCcureTimeSchedule(),
            this.syncCcureDoor(),
            this.syncCcureDoorReader(),
            this.syncCcureFloor(),
            this.syncCcurePermissionTable()
        ]);
    }

    private async syncCcurePermissionTable() {
        Log.Info(`${this.constructor.name}`, `CCure 2.8 PermissionTables`);
        let records = await cCureAdapter.getPermissionTables();
        console.log("PermissionTables", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data CCURE800 PermissionTables ${r["permissionTableName"]}-${r["permissionTableId"]}`);
                let obj = await new Parse.Query(PermissionTable).equalTo("tablename", r["permissionTableName"]).first();
                if (obj == null) {
                    let d = {
                        system: 800,
                        tableid: +r["permissionTableId"],
                        tablename: r["permissionTableName"],
                        status: 1
                    };
                    let o = new PermissionTable(d);
                    let o1 = await o.save();
                }
                else {
                    obj.set("system", 800);
                    obj.set("tableid", +r["permissionTableId"]);
                    obj.set("tablename", r["permissionTableName"]);
                    obj.save();
                }
                // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
            }
        }
        await delay(1000);
    }

    private async syncCcureFloor() {
        Log.Info(`${this.constructor.name}`, `CCure 2.6 Floors`);
        let records = await cCureAdapter.getFloors();
        console.log("Floors", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data CCURE800 Floors ${r["floorName"]}-${r["floorId"]}`);
                let obj = await new Parse.Query(Floor).equalTo("floorname", r["floorName"]).first();
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
                    obj.save();
                }
                // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
            }
        }
        await delay(1000);
    }

    private async syncCcureDoorReader() {
        Log.Info(`${this.constructor.name}`, `CCure 2.5 Door Readers`);
        let records = await cCureAdapter.getReaders();
        console.log("Readers", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data CCURE800 Readers ${r["deviceName"]}-${r["deviceId"]}`);
                let obj = await new Parse.Query(Reader).equalTo("readername", r["deviceName"]).first();
                if (obj == null) {
                    let d = {
                        system: 800,
                        readerid: +r["deviceId"],
                        readername: r["deviceName"],
                        status: 1
                    };
                    obj = new Reader(d);
                    await obj.save();
                }
                else {
                    obj.set("system", 800);
                    obj.set("readerid", +r["deviceId"]);
                    obj.set("readername", r["deviceName"]);
                    obj.save();
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

    private async syncCcureDoor() {
        Log.Info(`${this.constructor.name}`, `CCure 2.3 Doors`);
        let records = await cCureAdapter.getDoors();
        console.log("Doors", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data CCURE800 Doors ${r["doorName"]}-${r["doorId"]}`);
                let obj = await new Parse.Query(Door).equalTo("doorname", r["doorName"]).first();
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
                    obj.save();
                }
            }
            ;
        }
        await delay(1000);
    }

    private async syncCcureTimeSchedule() {
        Log.Info(`${this.constructor.name}`, `CCure 2.2 Time Schedule`);
        let records = await cCureAdapter.getTimeSchedule();
        console.log("Time Schedule", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data CCURE800 TimeSchedule ${r["timespecName"]}-${r["timespecId"]}`);
                let obj = await new Parse.Query(TimeSchedule).equalTo("timename", r["timespecName"]).first();
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
                    obj.save();
                }
            }
            ;
        }
        await delay(1000);
    }

    private async syncSipassCredentialProfile() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.9 Get All Credential Profiles`);
        let records = await siPassAdapter.getAllCredentialProfiles();
        console.log("Readers", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data SiPass CredentialProfiles ${r["Name"]}-${r["Token"]}`);
                let obj = await new Parse.Query(CredentialProfiles).equalTo("Token", r["Token"]).first();
                if (obj == null) {
                    r["system"] = 1;
                    let o = new CredentialProfiles(r);
                    await o.save();
                }
            }
            ;
        }
        await delay(1000);
    }

    private async syncSipassWorkgroup() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.8 Work Group List`);
        let grouplist = await siPassAdapter.getWorkGroupList();
        console.log("Work Group List", grouplist);
        if (grouplist) {
            for (let idx = 0; idx < grouplist.length; idx++) {
                Log.Info(`${this.constructor.name}`, `Import data SiPass WorkGroup ${grouplist[idx]["Name"]}-${grouplist[idx]["Token"]}`);
                let group = await siPassAdapter.getWorkGroup(grouplist[idx]["Token"]);
                let obj = await new Parse.Query(WorkGroup).equalTo("groupname", group["Name"]).first();
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
                    obj.save();
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

                        let obj = await new Parse.Query(TimeSchedule).equalTo("timeid", +level["TimeScheduleToken"]).first();
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
                let obj = await new Parse.Query(PermissionTable).equalTo("tablename", group["Name"]).first();
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
                    obj.save();
                }
                // await this.mongoDb.collection("PermissionTable").findOneAndUpdate({ "tablename": group["Name"] }, { $set: d }, { upsert: true });
                await delay(1000);
            }
        }

        await delay(1000);
    }

    private async syncSipassFloor() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.5 Floors`);
        let records = await siPassAdapter.getFloors();
        console.log("Floors", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data SiPass FloorPoints ${r["Name"]}-${r["Token"]}`);
                let obj = await new Parse.Query(Floor).equalTo("floorname", r["Name"]).first();
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
                    obj.save();
                }
                // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
            }
        }
        await delay(1000);
    }

    private async syncSipassDoorReader() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.3 Door Readers`);
        let records = await siPassAdapter.getReaders();
        console.log("Readers", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data SiPass Reader ${r["Name"]}-${r["Token"]}`);
                let obj = await new Parse.Query(Reader).equalTo("readername", r["Name"]).first();
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
                    obj.save();
                }
                // await this.mongoDb.collection("Reader").findOneAndUpdate({ "readerid": r["Token"] }, { $set: d }, { upsert: true });
            }
            ;
        }
        await delay(1000);
    }

    private async syncSipassSchedule() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.2 Time Schedule`);
        let records = await siPassAdapter.getTimeSchedule();
        console.log("Time Schedule", records);
        if (records) {
            for (let idx = 0; idx < records.length; idx++) {
                const r = records[idx];
                Log.Info(`${this.constructor.name}`, `Import data SiPass TimeSchedule ${r["Name"]}-${r["Token"]}`);
                let obj = await new Parse.Query(TimeSchedule).equalTo("timename", r["Name"]).first();
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
                    obj.save();
                }
                // await this.mongoDb.collection("TimeSchedule").findOneAndUpdate({ "timeid": r["Token"] }, { $set: d }, { upsert: true });
            }
            ;
        }
        await delay(1000);
    }
}

export default new ACSService();
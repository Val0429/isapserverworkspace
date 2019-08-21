import { Log } from './log';
import * as delay from 'delay';

import { Reader, Door, Floor, Elevator, Member, TimeSchedule, AccessLevel, PermissionTable, WorkGroup, DoorGroup, CredentialProfiles, PermissionTableDoor } from '../../custom/models'
import { siPassAdapter, cCureAdapter } from './acsAdapter-Manager';
import { ParseObject } from 'core/cgi-package';

export class SyncService{
     async syncCcurePermissionTable() {
        Log.Info(`${this.constructor.name}`, `CCure 2.8 PermissionTables`);
        let records = await cCureAdapter.getPermissionTables();
        console.log("PermissionTables", records);
        if(!records || records.length<=0)return;
        let objects = await new Parse.Query(PermissionTable)
                    .limit(Number.MAX_SAFE_INTEGER)
                    .containedIn("tableid", records.map(r=>parseInt(r["permissionTableId"])))
                    .equalTo("system", 800)
                    .find();
        let parseObjects=[];
        for (const r of records) {
            if (!r["permissionTableId"] || !r["permissionTableName"]) continue;
            Log.Info(`${this.constructor.name}`, `Import data CCURE800 PermissionTables ${r["permissionTableName"]}-${r["permissionTableId"]}`);
            let obj = objects.find(x=>x.get("tableid")== parseInt(r["permissionTableId"]));
            if (!obj) {
                let d = {
                    system: 800,
                    tableid: +r["permissionTableId"],
                    tablename: r["permissionTableName"],
                    status: 1
                };
                let o = new PermissionTable(d);
                if (!d.tableid || isNaN(d.tableid)) continue;
                parseObjects.push(o);
            }
            else {
                obj.set("system", 800);
                obj.set("tableid", +r["permissionTableId"]);
                obj.set("tablename", r["permissionTableName"]);
                parseObjects.push(obj);
            }
            
        }
        await ParseObject.saveAll(parseObjects);
    }

     async syncCcurePermissionTableDoor() {
        Log.Info(`${this.constructor.name}`, `CCure 2.6 syncCcurePermissionTableDoor`);
        let records = await cCureAdapter.getAllPermissionTableDoor();

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

       if(!records || records.length<=0)return;
       let objects = await new Parse.Query(PermissionTableDoor)
                .limit(Number.MAX_SAFE_INTEGER)
                .containedIn("permissionTableId", records.map(r=>parseInt(r["permissionTableId"])))
                .find();
       let parseObjects = [];
        for (const r of records) {
            
            Log.Info(`${this.constructor.name}`, `Import data CCURE800 PermissionTableDoor ${r["permissionTableId"]}-${r["doorId"]}`);
            let obj = objects.find(x=>x.get("permissionTableId")== parseInt(r["permissionTableId"]));
            if (!obj) {
                let d = {
                    system: 800,
                    permissionTableId: +r["permissionTableId"],
                    doorId: [r["doorId"]],
                    timespecId: r["timespecId"],
                    status: 1
                };
                let o = new PermissionTableDoor(d);
                parseObjects.push(o);
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
                parseObjects.push(obj);
            }
            
        }
        await ParseObject.saveAll(parseObjects);
        
    }

     async syncCcureFloor() {
        Log.Info(`${this.constructor.name}`, `CCure 2.6 Floors`);
        let records = await cCureAdapter.getFloors();
        if(!records || records.length<=0)return;
        let objects = await new Parse.Query(Floor)
                        .limit(Number.MAX_SAFE_INTEGER)
                        //.containedIn("floorid", records.map(x=>x.floorId))
                        //.equalTo("status", 1)
                        .equalTo("system", 800)
                        .find();
        //console.log("Floors", records);
        // "delete" non existing object
        for (let obj of objects){
            obj.set("status", 0);
        }
        for ( const r of records) {
            Log.Info(`${this.constructor.name}`, `Import data CCURE800 Floors ${r["floorName"]}-${r["floorId"]}`);
            let obj = objects.find(x=>x.get("floorid")== r.floorId);
            if (!obj) {
                let d = {
                    system: 800,
                    floorid: +r["floorId"],
                    floorname: r["floorName"],
                    status: 1
                };
                let o = new Floor(d);
                objects.push(o);
            }
            else {
                obj.set("system", 800);
                obj.set("floorid", +r["floorId"]);
                obj.set("floorname", r["floorName"]);
                obj.set("status", 1)
            }
        }
        await ParseObject.saveAll(objects);
    }

     async syncCcureDoorReader() {
        Log.Info(`${this.constructor.name}`, `CCure 2.5 Door Readers`);
        let records = await cCureAdapter.getReaders();
        if(!records || records.length<=0)return;
        //console.log("Readers", records);
        let objects = await new Parse.Query(Reader)
                    .limit(Number.MAX_SAFE_INTEGER)
                    //.containedIn("readerid", records.map(x=>x.deviceId))
                    //.equalTo("status", 1)
                    .equalTo("system", 800)
                    .find();
        // "delete" non existing object
        for (let obj of objects){
            obj.set("status", 0);
        }
        let doors = await new Parse.Query(Door)
                    .limit(Number.MAX_SAFE_INTEGER)
                    .include("readerin")
                    .containedIn("doorid", records.map(x=>x.doorId))
                    .find();
        let doorObjects =[];
        for (const r of records) {
            
            Log.Info(`${this.constructor.name}`, `Import data CCURE800 Readers ${r["deviceName"]}-${r["deviceId"]}`);
            let obj = objects.find(x=>x.get("readerid") == r.deviceId);
            if (!obj) {
                let d = {
                    system: 800,
                    readerid: r["deviceId"],
                    readername: r["deviceName"],
                    status: 1
                };
                obj = new Reader(d);
                objects.push(obj);
            }
            else {
                obj.set("system", 800);
                obj.set("readerid", r["deviceId"]);
                obj.set("readername", r["deviceName"]);
                obj.set("status", 1);
            }
            let door = doors.find(x=>x.get("doorid") == r.doorId);
            if (door && r.inOut=="In") {
                let readers = door.get("readerin");
                if (!readers){
                    readers = [obj];
                    door.set("readerin", readers);
                    doorObjects.push(door);
                }                     
                else if(!readers.find(x=>x.get("readerid")==r.deviceId)){
                    readers.push(obj);                    
                    door.set("readerin", readers);
                    doorObjects.push(door);
                }                    
            }
            if (door && r.inOut=="Out") {
                let readers = door.get("readerout");
                if (!readers){
                    readers = [obj];
                    door.set("readerout", readers);
                    doorObjects.push(door);
                }                     
                else if(!readers.find(x=>x.get("readerid")==r.deviceId)){
                    readers.push(obj);                    
                    door.set("readerout", readers);
                    doorObjects.push(door);
                }                    
            }
        }
        await ParseObject.saveAll(objects);
        await ParseObject.saveAll(doorObjects);
    }

     async syncCcureDoor() {
        Log.Info(`${this.constructor.name}`, `CCure 2.3 Doors`);
        let records = await cCureAdapter.getDoors();
        if(!records || records.length<=0)return;
        //console.log("Doors", records);
        let objects = await new Parse.Query(Door)
                .limit(Number.MAX_SAFE_INTEGER)
                //.containedIn("doorid", records.map(x=>x.doorId))
                //.equalTo("status", 1)
                .equalTo("system", 800)
                .find();
        // "delete" non existing object
        for (let obj of objects){
            obj.set("status", 0);
        }
        for (const r of records) {            
            Log.Info(`${this.constructor.name}`, `Import data CCURE800 Doors ${r["doorName"]}-${r["doorId"]}`);            
            let obj = objects.find(x=>x.get("doorid") == r.doorId)
            if (!obj) {
                let d = {
                    system: 800,
                    doorid: +r["doorId"],
                    doorname: r["doorName"],
                    status: 1
                };
                let o = new Door(d);
                objects.push(o);
            }
            else {
                obj.set("system", 800);
                obj.set("doorid", +r["doorId"]);
                obj.set("doorname", r["doorName"]);
                obj.set("status", 1);
            }
        }
        await ParseObject.saveAll(objects);      
    }

     async syncCcureTimeSchedule() {
        Log.Info(`${this.constructor.name}`, `CCure 2.2 Time Schedule`);
        let records = await cCureAdapter.getTimeSchedule();
        if(!records || records.length<=0)return;
        //console.log("Time Schedule", records);
        let objects = await new Parse.Query(TimeSchedule)
                    .limit(Number.MAX_SAFE_INTEGER)
                    .containedIn("timeid", records.map(r=>r["timespecId"]))
                    .equalTo("system", 800)
                    .find();
        let parseObjects = [];
        for (let idx = 0; idx < records.length; idx++) {
            const r = records[idx];
            Log.Info(`${this.constructor.name}`, `Import data CCURE800 TimeSchedule ${r["timespecName"]}-${r["timespecId"]}`);
            let obj = objects.find(x=>x.get("timeid") == r["timespecId"]);
            if (!obj) {
                let d = {
                    system: 800,
                    timeid: +r["timespecId"],
                    timename: r["timespecName"],
                    status: 1
                };
                let o = new TimeSchedule(d);
                parseObjects.push(o);
            }
            else {
                obj.set("system", 800);
                obj.set("timeid", +r["timespecId"]);
                obj.set("timename", r["timespecName"]);
                parseObjects.push(obj);
            }
        }
        await ParseObject.saveAll(parseObjects); 
    }
    async syncSipassReader() {
        Log.Info(`CGI acsSync`, `SiPass 2.3 Door Readers`);
        
        let records = await siPassAdapter.getReaders();
        if(!records || records.length<=0)return;
        let objects = await new Parse.Query(Reader)
                    .limit(Number.MAX_SAFE_INTEGER)
                    //.containedIn("readerid", records.map(x=>parseInt(x.Token)))
                    //.equalTo("status", 1)
                    .find();
        // "delete" non existing object
        for (let obj of objects){
            obj.set("status", 0);
        }
        for (const r of records) {
            
            Log.Info(`CGI acsSync`, `Import data SiPass Reader ${r["Name"]}-${r["Token"]}`);
            let obj = objects.find(x=>x.get("readerid")== parseInt(r.Token));
            if (!obj) {
                let d = {
                    system: 1,
                    readerid: parseInt(r["Token"]),
                    readername: r["Name"],
                    status: 1
                };
                let o = new Reader(d);
                objects.push(o);
            }
            else {
                obj.set("system", 1);
                obj.set("readerid", parseInt(r["Token"]));
                obj.set("readername", r["Name"]);
                obj.set("status", 1)
            }
        }
        
        await ParseObject.saveAll(objects);
    }
     async syncSipassCredentialProfile() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.9 Get All Credential Profiles`);
        let records = await siPassAdapter.getAllCredentialProfiles();
        if(!records || records.length<=0)return;
        let objects = await new Parse.Query(CredentialProfiles)
                        .limit(Number.MAX_SAFE_INTEGER)
                        .containedIn("Token", records.map(r=>r["Token"]))
                        .find();
        //console.log("Readers", records);
        let parseObjects=[];
        for (const r of records) {
            
            Log.Info(`${this.constructor.name}`, `Import data SiPass CredentialProfiles ${r["Name"]}-${r["Token"]}`);
            let obj = objects.find(x=>x.get("Token") == r["Token"]);
            if (!obj) {
                let o = new CredentialProfiles(r);
                parseObjects.push(o);
            }
        }
            
        await ParseObject.saveAll(parseObjects);
    }

     async syncSipassWorkgroup() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.8 Work Group List`);
        let records = await siPassAdapter.getWorkGroupList();
        //console.log("Work Group List", records);
        if(!records || records.length<=0)return;
        let parseObjects=[];
        for (const r of records) {
            Log.Info(`${this.constructor.name}`, `Import data SiPass WorkGroup ${r["Name"]}-${r["Token"]}`);
            let group = await siPassAdapter.getWorkGroup(r["Token"]);
            let obj = await new Parse.Query(WorkGroup)
                .equalTo("groupid", group["Token"])
                .equalTo("system", 1)
                .first();
            if (!obj) {
                let d = {
                    system: 1,
                    groupid: +group["Token"],
                    groupname: group["Name"],
                    type: +group["Type"],
                    accesspolicyrules: group["AccessPolicyRules"],
                    status: 1
                };
                let o = new WorkGroup(d);
                 parseObjects.push(o);
            }
            else {
                obj.set("system", 1);
                obj.set("groupid", +group["Token"]);
                obj.set("groupname", group["Name"]);
                obj.set("type", +group["Type"]);
                obj.set("accesspolicyrules", group["AccessPolicyRules"]);
                parseObjects.push(obj);
            }
        }
        await ParseObject.saveAll(parseObjects);
    }

     async syncSipassAcessGroup() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.7 Access Group List`);

        let readers = await new Parse.Query(Reader).find();

        let records = await siPassAdapter.getAccessGroupList();
        //console.log("Access Group List", records);

        if(!records || records.length<=0)return;
        let parseObjects =[];
            for (let i = 0; i < records.length; i++) {
                Log.Info(`${this.constructor.name}`, `Import data SiPass AccessGroups ${records[i]["Name"]}-${records[i]["Token"]}`);

                let group = await siPassAdapter.getAccessGroup(records[i]["Token"]);

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
                            parseObjects.push(o);
                        }
                        else {
                            obj.set("system", 1);
                            obj.set("levelid", +level["Token"]);
                            obj.set("levelname", level["Name"]);
                            obj.set("reader", rs);
                            obj.set("timeschedule", obj);
                            parseObjects.push(obj);
                        }

                        // let lev = await this.mongoDb.collection("AccessLevel").findOneAndUpdate({ "levelname": level["Name"] }, { $set: d }, { upsert: true, returnOriginal: false });
                        // let o = new AccessLevel(d);
                        // let lev = await o;
                        // acl.push(lev.value.id);
                        acl.push(lev);
                        
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
                    parseObjects.push( o);
                }
                else {
                    obj.set("system", 1);
                    obj.set("tableid", +group["Token"]);
                    obj.set("tablename", group["Name"]);
                    obj.set("accesslevels", acl);
                    parseObjects.push(obj);
                }
                
                
            }
        
            await ParseObject.saveAll(parseObjects);
    }

     async syncSipassFloor() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.5 Floors`);
        let records = await siPassAdapter.getFloors();
        if(!records || records.length<=0)return;
        let objects = await new Parse.Query(Floor)
                    .limit(Number.MAX_SAFE_INTEGER)
                    //.containedIn("floorid",records.map(x=>parseInt(x.Token)))
                    //.equalTo("status", 1)
                    .equalTo("system", 1)
                    .find();
       // console.log("Floors", records);
        // "delete" non existing object
        for (let obj of objects){
            obj.set("status", 0);
        }
        for (let idx = 0; idx < records.length; idx++) {
            const r = records[idx];
            Log.Info(`${this.constructor.name}`, `Import data SiPass FloorPoints ${r["Name"]}-${r["Token"]}`);
            let obj = objects.find(x=>x.get("floorid")==parseInt(r.Token));
            if (!obj) {
                let d = {
                    system: 1,
                    floorid: +r["Token"],
                    floorname: r["Name"],
                    status: 1
                };
                let o = new Floor(d);
                objects.push(o);
            }
            else {
                obj.set("system", 1);
                obj.set("floorid", +r["Token"]);
                obj.set("floorname", r["Name"]);
                obj.set("status", 1);
            }
            
        }
        await ParseObject.saveAll(objects);
    }

     async syncSipassDoorReader() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.3 Door Readers`);
        let records = await siPassAdapter.getReaders();
        if(!records || records.length<=0)return;
        //console.log("Readers", records);
        let objects = await new Parse.Query(Reader)
                    .limit(Number.MAX_SAFE_INTEGER)
                    .containedIn("readerid", records.map(r=>parseInt(r.Token)))
                    .equalTo("system", 1)
                    .find();
        let parseObjects=[];
        for (const r of records) {
                Log.Info(`${this.constructor.name}`, `Import data SiPass Reader ${r["Name"]}-${r["Token"]}`);
                let obj = objects.find(x=>x.get("readerid") == parseInt(r.Token));
                if (!obj) {
                    let d = {
                        system: 1,
                        readerid: +r["Token"],
                        readername: r["Name"],
                        status: 1
                    };
                    let o = new Reader(d);
                    parseObjects.push(o);
                }
                else {
                    obj.set("system", 1);
                    obj.set("readerid", +r["Token"]);
                    obj.set("readername", r["Name"]);
                    parseObjects.push(obj);
                }
            }
            
        await ParseObject.saveAll(parseObjects);
    }

     async syncSipassSchedule() {
        Log.Info(`${this.constructor.name}`, `SiPass 2.2 Time Schedule`);
        let records = await siPassAdapter.getTimeSchedule();
        let objects = await new Parse.Query(TimeSchedule)
                    .limit(Number.MAX_SAFE_INTEGER)
                    //.containedIn("timeid", records.map(x=> parseInt(x.Token)))
                    //.equalTo("status", 1)
                    .equalTo("system", 1)
                    .find();
        //console.log("Time Schedule", records);
        let parseObjects=[];
        for (const r of records) {
            
            Log.Info(`${this.constructor.name}`, `Import data SiPass TimeSchedule ${r["Name"]}-${r["Token"]}`);
            let obj = objects.find(x=>x.get("timeid") == parseInt(r["Token"]));
            if (!obj) {
                let d = {
                    system: 1,
                    timeid: +r["Token"],
                    timename: r["Name"],
                    status: 1
                };
                let o = new TimeSchedule(d);
                parseObjects.push(o);
            }
            else {
                obj.set("system", 1);
                obj.set("timeid", +r["Token"]);
                obj.set("timename", r["Name"]);
                parseObjects.push(obj);
            }
        }
            
        await ParseObject.saveAll(parseObjects);
    }
}

export default new SyncService();
import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject, TimeSchedule, Door, AccessLevel, DoorGroup, AccessLevelinSiPass
} from 'core/cgi-package';

import { IPermissionTable, PermissionTable, PermissionTableDoor } from '../../custom/models'
import { siPassAdapter, cCureAdapter } from '../../custom/services/acsAdapter-Manager';

import { Log } from 'helpers/utility';
import * as delay from 'delay';

var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "3-3_door_permissiontable_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IPermissionTable>;
type OutputC = Restful.OutputC<IPermissionTable>;

action.post<InputC, any>({ inputType: "InputC" }, async (data) => {
    /// 1) Check data.inputType
    // if ( (siPassAdapter.sessionToken == undefined) || (siPassAdapter.sessionToken == "") ) {
    //     Log.Info(`CGI acsSync`, `SiPass Connect fail. Please contact system administrator!`);
    //     throw Errors.throw(Errors.CustomNotExists, [`SiPass Connect fail. Please contact system administrator!`]);
    // }

    /// 2) Create Object
    let name = data.inputType.tablename;
    let nameObject = await new Parse.Query(PermissionTable).equalTo("tablename", name).equalTo("system", 0)
        .include("door").first();
    if (nameObject != null) {
        throw Errors.throw(Errors.CustomNotExists, [`Permssion table name is duplicate.`]);
    }

    let doorExist = [];
    if (data.inputType.accesslevels) {
        for (let i = 0; i < data.inputType.accesslevels.length; i++) {
            let levelGroup = data.inputType.accesslevels[i];
            let door=levelGroup.get("door");
            if(door&&door["doorid"])doorExist.push(door["doorid"]);
        }
    }

    let pt = await new Parse.Query(PermissionTableDoor).containsAll("doorid", doorExist).first();
    if ( pt != null) {
        let pt1 = await new Parse.Query(PermissionTable).equalTo("tableid", pt.get("permissionTableId")).first();

        throw Errors.throw(Errors.CustomNotExists, [`Permssion table is duplicate with ${pt1.get("tableid")} ${pt1.get("tablename")}`]);   
    }

    // 2.0 Modify Access Group
    
    let al = [];
    if (data.inputType.accesslevels) {
        for (let levelGroup of data.inputType.accesslevels.map(x=>ParseObject.toOutputJSON(x))) {
            console.log("levelGroup", levelGroup);
            if(levelGroup.levelinSiPass && levelGroup.levelinSiPass.length>0)
                al.push(...levelGroup.levelinSiPass.map(x=>{return {Token:x.token, Name:x.name}}));            
        }
    }
    console.log("access levels", al);
    if ( al.length <= 0) {
        throw Errors.throw(Errors.CustomNotExists, [`Create Permission Table FAil Access Level is Empty!`]);
    }

    let ag = {
        token: "-1",
        name: data.inputType.tablename,
        accessLevels: al
    };
    let accessLevels=data.inputType.accesslevels.map(x=>ParseObject.toOutputJSON(x));
    
    let {permTableNames, devices, errors} = await checkCCureDevices(accessLevels);
    if(errors.length>0)return {errors};
    data.inputType.ccurePermissionTable = permTableNames.find(x=>x.devices.length == devices.length);

    if(!data.inputType.ccurePermissionTable){
        errors.push({type:"clearanceIsNotInCCure"});
        return {permTableNames, errors};
    }
    Log.Info(`${this.constructor.name}`, `Sync to SiPass ${ JSON.stringify(ag) }`);
    let r1 = await siPassAdapter.postAccessGroup(ag);

    if(!r1["Token"]){
        throw Errors.throw(Errors.CustomNotExists, [`Cannot get token from sipass.`]);
    }
    data.inputType.tableid = +r1["Token"];
    data.inputType.system = 0;
    var obj = new PermissionTable(data.inputType);
    //let ccurePermissionTable = 
    await obj.save(null, { useMasterKey: true });
    Log.Info(`${this.constructor.name}`, `postPermisiionTable ${data.inputType.tableid} ${data.inputType.tablename}`);
    

    /// 2) Output
    return { permTableNames, errors };
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IPermissionTable>;
type OutputR = Restful.OutputR<IPermissionTable>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(PermissionTable)
        .include("accesslevels.door")
        .include("accesslevels.doorgroup")
        .include("accesslevels.timeschedule")
        .include("accesslevels.reader");

    let filter = data.parameters as any;
    if(filter.name){
        query.matches("tablename", new RegExp(filter.name), "i");
    }
    if(filter.timename){
        let tsQuery = new Parse.Query(TimeSchedule).matches("timename", new RegExp(filter.timename), "i");    
        let alQuery = new Parse.Query(AccessLevel).matchesQuery("timeschedule", tsQuery);    
        query.matchesQuery("accesslevels", alQuery);
    }
    if(filter.doorname){
        let doorQuery = new Parse.Query(Door).matches("doorname", new RegExp(filter.doorname), "i");    
        let alQuery = new Parse.Query(AccessLevel).matchesQuery("door", doorQuery);
        query.matchesQuery("accesslevels", alQuery);
    }
    if(filter.doorgroupname){
        let dgQuery = new Parse.Query(DoorGroup).matches("groupname", new RegExp(filter.doorgroupname), "i");    
        let alQuery = new Parse.Query(AccessLevel).matchesQuery("doorgroup", dgQuery);
        query.matchesQuery("accesslevels", alQuery);
    }
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IPermissionTable>;
type OutputU = Restful.OutputU<IPermissionTable>;

action.put<InputU, any>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(PermissionTable).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`PermissionTable <${objectId}> not exists.`]);
    
    Log.Info(`${this.constructor.name}`, `putPermissionTable ${obj.get("tableid")} ${obj.get("tablename")}`);

    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });

    // 2.0 Modify Access Group
    
        let al = [];
    if (data.inputType.accesslevels) {
        for (let i = 0; i < data.inputType.accesslevels.length; i++) {
            let levelGroup = data.inputType.accesslevels[i];

            for (let j = 0; j < levelGroup.get("levelinSiPass").length; j++) {
                al.push(levelGroup.get("levelinSiPass")[j]);    
            }
        }
    }
    if ( al.length <= 0) {
        throw Errors.throw(Errors.CustomNotExists, [`Create Permission Table FAil Access Level is Empty!`]);
    }

	let ag = {
        token: obj.get("tableid") + "",
        name: data.inputType.tablename,
        accessLevels: al
    };
    
    let accessLevels=data.inputType.accesslevels.map(x=>ParseObject.toOutputJSON(x));
    let {permTableNames, errors} = await checkCCureDevices(accessLevels);
    if(errors.length>0) return {errors};

    Log.Info(`${this.constructor.name}`, `Sync to SiPass ${ JSON.stringify(ag) }`);
    await siPassAdapter.putAccessGroup(ag);
    
    /// 3) Output
    return {permTableNames, errors};
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IPermissionTable>;
type OutputD = Restful.OutputD<IPermissionTable>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(PermissionTable).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`PermissionTable <${objectId}> not exists.`]);
    
    Log.Info(`${this.constructor.name}`, `deletePermissionTable ${obj.get("tableid")} ${obj.get("tablename")}`);

    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
function getPermTables(ccureDoors: any[], door: any, timeSchedules: any[], timeschedule: any, errors: any[], cCurePermissionTableDoors: any[], ccurePermissionTables: any[]) {
    
    let ccureDoor = ccureDoors.find(x => x.doorName == door.doorname);
    let ccureTimeSchedule = timeSchedules.find(x => x.timespecName == timeschedule.timename);
    if (!ccureDoor || !ccureTimeSchedule) {        
        errors.push({ type: "accessLevelIsNotInCCure", doorname: door.doorname, timename: timeschedule.timename});
    }
    
    if (ccureTimeSchedule && ccureDoor) {
        let permissionTableDoors = cCurePermissionTableDoors.filter(x => x.timespecId == ccureTimeSchedule.timespecId && x.doorId == ccureDoor.doorId)
            .map(x=>x.permissionTableId).filter((value, index, self)=> self.indexOf(value)==index);
        if (permissionTableDoors.length==0) {            
            errors.push({ type: "accessLevelIsNotInCCure", doorname: door.doorname, timename: timeschedule.timename });
        }
        else {
            let permissionTables = ccurePermissionTables.filter(x => permissionTableDoors.indexOf(x.permissionTableId)>=0);
            if (permissionTables.length==0){
                errors.push({ type: "accessLevelIsNotInCCure", doorname: door.doorname, timename: timeschedule.timename });
            }else{
                return permissionTables;
            }                
        }
    }
}

async function checkCCureDevices( accessLevels:any[]){
    let errors:any[]=[];
    let devices=[];
    let ccureDoors = await cCureAdapter.getDoors();
    let permissionTables = await cCureAdapter.getPermissionTables();
    let permissionTableDoors = await cCureAdapter.GetAllPermissionTableDoor();
    let timeSchedules = await cCureAdapter.getTimeSchedule();
    let permTableNames:any[]=[];
    for (let accesslevelInput of accessLevels) {
        let accesslevelObject = await new Parse.Query(AccessLevel).equalTo("objectId", accesslevelInput.objectId).include("doorgroup.doors").first();
        let accesslevel = ParseObject.toOutputJSON(accesslevelObject);
        console.log("accesslevel", accesslevel)
        let tsObject = await new Parse.Query(TimeSchedule).equalTo("objectId", accesslevel.timeschedule.objectId).first();
        let timeschedule = ParseObject.toOutputJSON(tsObject);

        
        if(accesslevel.type=="door"){
            if(!accesslevel.door || !accesslevel.timeschedule)continue;
            //compare content with ccure door name and timename            
            let { doorIsInCCure, door } = await getCCureDoor(accesslevel.door.objectId);            
            if(!doorIsInCCure) continue;
            devices.push(door);
            let perms = getPermTables(ccureDoors, door, timeSchedules, timeschedule, errors, permissionTableDoors, permissionTables);
            checkPermTables(permTableNames,perms, door, timeschedule);
        }

        if(accesslevel.type=="doorGroup"){
            if(!accesslevel.doorgroup || !accesslevel.timeschedule)continue;
            for(let doorid of accesslevel.doorgroup.doors){
               
                let { doorIsInCCure, door } = await getCCureDoor(doorid.objectId);
                if(!doorIsInCCure) continue;
                devices.push(door);
                //compare content with ccure door name and timename    
                let perms = getPermTables(ccureDoors, door, timeSchedules, timeschedule, errors, permissionTableDoors, permissionTables);
                checkPermTables(permTableNames,perms, door, timeschedule);
            }            
        }

        
    }
    return {permTableNames, devices, errors};

    
}
function checkPermTables(permTableNames: any[],perms: any[],device:any, timeschedule:any) {
    if(!perms)return;
    let name = device.doorname;
    for (let perm of perms) {
        let exists = permTableNames.find(x => x.permissionTableName == perm.permissionTableName);
        if (exists) {
            perm.devices.puhs({device:{name}, timeschedule});
        }
        else {
            perm.devices = [{device:{name}, timeschedule}];
            permTableNames.push(perm);            
        }
        
    }
}
async function getCCureDoor(doorObjectId: any) {
    let doorObject = await new Parse.Query(Door).equalTo("objectId", doorObjectId)
        .include("readerin")
        .include("readerout")
        .first();
    let door = ParseObject.toOutputJSON(doorObject);
    let readers = [];
    if (door.readerin && door.readerin.length > 0)
        readers.push(...door.readerin);
    if (door.readerout && door.readerout.length > 0)
        readers.push(...door.readerout);
    let doorIsInCCure = readers.find(x => x.readername && x.readername.length > 2 && x.readername.substr(0, 2).toLowerCase() != "d_");
    console.log("doorIsInCcure", doorIsInCCure, "readers", readers);
    return { doorIsInCCure, door };
}

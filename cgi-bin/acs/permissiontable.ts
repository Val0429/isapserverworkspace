import {
    Action, Errors, Restful, ParseObject, TimeSchedule, Door, AccessLevel, Floor
} from 'core/cgi-package';

import { IPermissionTable, PermissionTable, PermissionTableDoor } from '../../custom/models'
import { siPassAdapter, cCureAdapter } from '../../custom/services/acsAdapter-Manager';

import { Log } from 'workspace/custom/services/log';

var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "door_permissiontable_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IPermissionTable>;

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
    let ccurePermissionTable = permTableNames.find(x=>x.devices.length == devices.length && x.permissionTableName==data.inputType.tablename);

    if(!ccurePermissionTable){
        errors.push({type:"clearanceIsNotInCCure"});
        return {permTableNames, errors};
    }
    delete(ccurePermissionTable.devices);
    data.inputType.ccurePermissionTable=ccurePermissionTable;
    Log.Info(`info`, `Sync to SiPass ${ JSON.stringify(ag) }`, data.user);
    let r1 = await siPassAdapter.postAccessGroup(ag);

    if(!r1["Token"]){
        throw Errors.throw(Errors.CustomNotExists, [`Cannot get token from sipass.`]);
    }
    data.inputType.tableid = +r1["Token"];
    data.inputType.system = 0;
    var obj = new PermissionTable(data.inputType);
    //let ccurePermissionTable = 
    await obj.save(null, { useMasterKey: true });
    Log.Info(`info`, `postPermisiionTable ${data.inputType.tableid} ${data.inputType.tablename}`, data.user, false);
    

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
                .equalTo("system", 0)
                .include("accesslevels");

    let filter = data.parameters as any;
    if(filter.name){
        query.matches("tablename", new RegExp(filter.name), "i");
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

action.put<InputU, any>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(PermissionTable).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`PermissionTable <${objectId}> not exists.`]);
    
    Log.Info(`info`, `putPermissionTable ${obj.get("tableid")} ${obj.get("tablename")}`, data.user, false);

    

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
    let {permTableNames, devices, errors} = await checkCCureDevices(accessLevels);
    if(errors.length>0)return {errors};
    let ccurePermissionTable = permTableNames.find(x=>x.devices.length == devices.length && x.permissionTableName==data.inputType.tablename);;

    if(!ccurePermissionTable){
        errors.push({type:"clearanceIsNotInCCure"});
        return {permTableNames, errors};
    }
    delete(ccurePermissionTable.devices);
    data.inputType.ccurePermissionTable = ccurePermissionTable;
    Log.Info(`info`, `Sync to SiPass ${ JSON.stringify(ag) }`, data.user);
    await siPassAdapter.putAccessGroup(ag);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
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
    
    Log.Info(`info`, `deletePermissionTable ${obj.get("tableid")} ${obj.get("tablename")}`, data.user, false);

    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
function getPermTableDoors(ccureDoors: any[], door: any, timeSchedules: any[], timeschedule: any, errors: any[], cCurePermissionTableDoors: any[], ccurePermissionTables: any[]) {
    let type="accessLevelIsNotInCCure";
    let err={ type, devicename: door.doorname, timename: timeschedule.timename };
    let ccureDoor = ccureDoors.find(x => x.doorName == door.doorname);
    let ccureTimeSchedule = timeSchedules.find(x => x.timespecName == timeschedule.timename);
    if (!ccureDoor || !ccureTimeSchedule) {        
        errors.push(err);
        return;
    }    
    
    let permissionTableDoors = cCurePermissionTableDoors.filter(x => x.timespecId == ccureTimeSchedule.timespecId && x.doorId == ccureDoor.doorId)
        .map(x=>x.permissionTableId).filter((value, index, self)=> self.indexOf(value)==index);
    if (permissionTableDoors.length==0) {            
        errors.push(err);
    }
    else {
        let permissionTables = ccurePermissionTables.filter(x => permissionTableDoors.indexOf(x.permissionTableId)>=0);
        if (permissionTables.length==0){
            errors.push(err);
        }else{
            return permissionTables;
        }                
    }
    
}

async function checkCCureDevices( accessLevels:any[]){
    let errors:any[]=[];
    let devices=[];
    let permissionTables:any[] = await cCureAdapter.getPermissionTables();
    let timeSchedules:any[] = await cCureAdapter.getTimeSchedule();

    let ccureDoors:any[];    
    let permissionTableDoors:any[];    
    let permissionTableFloors:any[];
    let ccureFloors:any[];
    let ccureElevators:any[];
    let permTableNames:any[]=[];

    for (let accesslevelInput of accessLevels) {
        let accesslevelObject = await new Parse.Query(AccessLevel).equalTo("objectId", accesslevelInput.objectId)
            .include("doorgroup.doors")
            .include("elevator")
            .include("floorgroup.floors")
            .first();
        let accesslevel = ParseObject.toOutputJSON(accesslevelObject);
        console.log("accesslevel", accesslevel)
        let tsObject = await new Parse.Query(TimeSchedule).equalTo("objectId", accesslevel.timeschedule.objectId).first();
        let timeschedule = ParseObject.toOutputJSON(tsObject);

        
        if(accesslevel.type=="door"){
            if(!accesslevel.door || !accesslevel.timeschedule)continue;
            if(!ccureDoors) ccureDoors = await cCureAdapter.getDoors();
            if(!permissionTableDoors)permissionTableDoors = await cCureAdapter.GetAllPermissionTableDoor();
            //compare content with ccure door name and timename            
            let { doorIsInCCure, door } = await getCCureDoor(accesslevel.door.objectId);            
            if(!doorIsInCCure) continue;
            devices.push(door);
            let perms = getPermTableDoors(ccureDoors, door, timeSchedules, timeschedule, errors, permissionTableDoors, permissionTables);
            checkPermTables(permTableNames, perms, door.doorname, timeschedule.timename);
        }

        if(accesslevel.type=="doorGroup"){
            if(!accesslevel.doorgroup || !accesslevel.timeschedule)continue;
            if(!ccureDoors) ccureDoors = await cCureAdapter.getDoors();
            if(!permissionTableDoors)permissionTableDoors = await cCureAdapter.GetAllPermissionTableDoor();

            for(let doorid of accesslevel.doorgroup.doors){               
                let { doorIsInCCure, door } = await getCCureDoor(doorid.objectId);
                if(!doorIsInCCure) continue;
                devices.push(door);
                //compare content with ccure door name and timename    
                let perms = getPermTableDoors(ccureDoors, door, timeSchedules, timeschedule, errors, permissionTableDoors, permissionTables);
                checkPermTables(permTableNames, perms, door.doorname, timeschedule.timename);
            }            
        }

        if(accesslevel.type=="elevator"){
            if(!accesslevel.elevator || !(accesslevel.floor && accesslevel.floor.length>0) || !accesslevel.timeschedule)continue;
            if(!permissionTableFloors) permissionTableFloors = await cCureAdapter.GetAllPermissionTableFloor();
            if(!ccureFloors)ccureFloors = await cCureAdapter.getFloors();
            if(!ccureElevators) ccureElevators = await cCureAdapter.getElevators();
            //compare content with ccure floor name and timename            
            let { floorIsInCCure, floor } = await getCCureFloor(accesslevel.floor[0].objectId);            
            if(!floorIsInCCure) continue;
            devices.push(floor);
            let perms = getPermTableFloors(ccureElevators, accesslevel.elevator, ccureFloors, floor, timeSchedules, timeschedule, errors, permissionTableFloors, permissionTables);
            checkPermTables(permTableNames, perms, accesslevel.elevator.elevatorname+"-"+floor.floorname, timeschedule.timename);
        }
        if(accesslevel.type=="floorGroup"){
            if(!accesslevel.elevator || !(accesslevel.floorgroup && accesslevel.floor.length>0) || !accesslevel.timeschedule)continue;
            if(!permissionTableFloors) permissionTableFloors = await cCureAdapter.GetAllPermissionTableFloor();
            if(!ccureFloors)ccureFloors = await cCureAdapter.getFloors();
            if(!ccureElevators) ccureElevators = await cCureAdapter.getElevators();
            //compare content with ccure floor name and timename 
            for(let alFloor of accesslevel.floor){
                let { floorIsInCCure, floor } = await getCCureFloor(alFloor.objectId);            
                if(!floorIsInCCure) continue;
                devices.push(floor);
                let perms = getPermTableFloors(ccureElevators, accesslevel.elevator, ccureFloors, floor, timeSchedules, timeschedule, errors, permissionTableFloors, permissionTables);
                checkPermTables(permTableNames, perms, accesslevel.elevator.elevatorname+"-"+floor.floorname, timeschedule.timename);
            }    
            
        }
    }
    return {permTableNames, devices, errors};

    
}
function checkPermTables(permTableNames: any[],perms: any[],devicename:string, timename:string) {
    if(!perms)return;
    
    for (let perm of perms) {
        let exists = permTableNames.find(x => x.permissionTableName == perm.permissionTableName);
        if (exists) {
            perm.devices.push({devicename, timename});
        }
        else {
            perm.devices = [{devicename, timename}];
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

async function getCCureFloor(floorObjectId: any) {
    let floorObject = await new Parse.Query(Floor)
        .equalTo("objectId", floorObjectId)
        .first();
    let floor = ParseObject.toOutputJSON(floorObject);
    let floorIsInCCure = floor.floorname && floor.floorname.length > 2 && floor.floorname.substr(0, 2).toLowerCase() != "d_";
    console.log("foorIsInCCure", floorIsInCCure, "floor", floor);
    return { floorIsInCCure, floor };
}
function getPermTableFloors(ccureElevators:any[], elevator:any, ccureFloors: any[], floor: any, timeSchedules: any[], timeschedule: any, errors: any[], cCurePermissionTableFloors: any[], ccurePermissionTables: any[]) {
    let type="accessLevelIsNotInCCure";
    let err ={ type, devicename: `${elevator.elevatorname}-${floor.floorname}`, timename: timeschedule.timename};
    let ccureElevator = ccureElevators.find(x => x.elevatorName == elevator.elevatorname);
    let ccureFloor = ccureFloors.find(x => x.floorName == elevator.floorname);
    let ccureTimeSchedule = timeSchedules.find(x => x.timespecName == timeschedule.timename);
    if (!ccureElevator || !ccureTimeSchedule || !ccureFloor) {        
        errors.push(err);
        return;
    }

    let permissionTableFloors = cCurePermissionTableFloors.filter(x => 
                    x.timespecId == ccureTimeSchedule.timespecId && 
                    x.elevatorId == ccureElevator.elevatorId && 
                    x.floorId == ccureElevator.floorId)
                .map(x=>x.permissionTableId)
                .filter((value, index, self)=> self.indexOf(value)==index);
    if (permissionTableFloors.length==0) {            
        errors.push(err);
    }
    else {
        let permissionTables = ccurePermissionTables.filter(x => permissionTableFloors.indexOf(x.permissionTableId)>=0);
        if (permissionTables.length==0){
            errors.push(err);
        }else{
            return permissionTables;
        }                
    }
    
}
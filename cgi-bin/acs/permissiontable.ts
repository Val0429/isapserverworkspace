import {
    Action, Errors, Restful, ParseObject, TimeSchedule, Door, AccessLevel, Floor
} from 'core/cgi-package';

import { IPermissionTable, PermissionTable, PermissionTableDoor } from '../../custom/models'
import { siPassAdapter, cCureAdapter } from '../../custom/services/acsAdapter-Manager';

import { Log } from 'workspace/custom/services/log';
import { GetMigrationDataPermissionTable } from 'workspace/custom/modules/acs/ccure/Migration';

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
    
    let {devices, errors} = await checkCCureDevices(data.inputType.tablename, accessLevels);
    if(errors.length>0)return {errors};
    
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
    return { devices, errors };
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
                .include("accesslevels.doorgroup.doors")
                .include("accesslevels.timeschedule");

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
    let {devices, errors} = await checkCCureDevices(data.inputType.tablename, accessLevels);
    if(errors.length>0)return {errors};
    
    
    Log.Info(`info`, `Sync to SiPass ${ JSON.stringify(ag) }`, data.user);
    await siPassAdapter.putAccessGroup(ag);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return {devices, errors};
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


async function checkCCureDevices(tablename:string, accessLevels:any[]){
    let errors:any[]=[];
    let devices=[];
    let ccureClearances = await GetMigrationDataPermissionTable();    
    let ccureClearance = ccureClearances[tablename];
    console.log("ccureClearance", ccureClearance);
    
    let accessLevelIsNotInCCure="accessLevelIsNotInCCure";
    let clearanceIsNotInCCure="clearanceIsNotInCCure";

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
           
            //compare content with ccure door name and timename            
            let { doorIsInCCure, door } = await getCCureDoor(accesslevel.door.objectId);            
            if(!doorIsInCCure) continue;
            devices.push(door);
            if (!ccureClearance) {
                errors.push({ type: clearanceIsNotInCCure });
            }
            else {
                let exists = ccureClearance.find(x => x.type == "door" && x.name == door.doorname && x.timespec == timeschedule.timename);
                if (!exists)
                    errors.push({ type: accessLevelIsNotInCCure, devicename: door.doorname, timename: timeschedule.timename });
            }
        }

        if(accesslevel.type=="doorGroup"){
            if(!accesslevel.doorgroup || !accesslevel.timeschedule)continue;
                        
            for(let doorid of accesslevel.doorgroup.doors){
                //compare content with ccure door name and timename                  
                let { doorIsInCCure, door } = await getCCureDoor(doorid.objectId);
                if(!doorIsInCCure) continue;
                devices.push(door);
                if (!ccureClearance) {
                    errors.push({ type: clearanceIsNotInCCure });
                }
                else {
                    let exists = ccureClearance.find(x => x.type == "doorGroup" && x.name == accesslevel.doorgroup.groupname &&
                             x.timespec == timeschedule.timename && x.doors.find(y=>y.name==door.doorname));
                    if (!exists)
                        errors.push({ type: accessLevelIsNotInCCure, devicename: `${accesslevel.doorgroup.groupname}-${door.doorname}`, timename: timeschedule.timename });
                }
                 
            }            
        }

        if(accesslevel.type=="elevator"){
            if(!accesslevel.elevator || !(accesslevel.floor && accesslevel.floor.length>0) || !accesslevel.timeschedule)continue;
            
            //compare content with ccure floor name and timename            
            let { floorIsInCCure, floor } = await getCCureFloor(accesslevel.floor[0].objectId);            
            if(!floorIsInCCure) continue;
            devices.push(floor);
            if (!ccureClearance) {
                errors.push({ type: clearanceIsNotInCCure });
            }
            else {
                let exists = ccureClearance.find(x => x.type == "elevatorFloor" && x.name == accesslevel.elevator.elevatorname && 
                                x.timespec == timeschedule.timename && x.floor && x.floor.type=="floor" && x.floor.name == floor.floorname);
                if (!exists)
                    errors.push({ type: accessLevelIsNotInCCure, devicename: `${accesslevel.elevator.elevatorname}-${floor.floorname}`, timename: timeschedule.timename });
            }
            
        }
        if(accesslevel.type=="floorGroup"){
            if(!accesslevel.elevator || !(accesslevel.floorgroup && accesslevel.floor.length>0) || !accesslevel.timeschedule)continue;
            
            //compare content with ccure floor name and timename 
            for(let alFloor of accesslevel.floor){
                let { floorIsInCCure, floor } = await getCCureFloor(alFloor.objectId);            
                if(!floorIsInCCure) continue;
                devices.push(floor);
                if (!ccureClearance) {
                    errors.push({ type: clearanceIsNotInCCure });
                }
                else {
                    let exists = ccureClearance.find(x => x.type == "elevatorFloor" && x.name == accesslevel.elevator.elevatorname && 
                                    x.timespec == timeschedule.timename && x.floor  && x.floor.type=="floorGroup" && x.floors.find(y=>y.floor.name == floor.floorname));
                    if (!exists)
                        errors.push({ type: accessLevelIsNotInCCure, devicename: `${accesslevel.elevator.elevatorname}-${floor.floorname}`, timename: timeschedule.timename });
                }
            }    
            
        }
    }
    return {devices, errors};

    
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
    let doorIsInCCure = readers.find(x=>x.readername.length>=2  && x.system==800 && x.readername.substring(0,2)!="D_")
    console.log("doorIsInCcure", doorIsInCCure, "readers", readers);
    return { doorIsInCCure, door };
}

async function getCCureFloor(floorObjectId: any) {
    let floorObject = await new Parse.Query(Floor)
        .equalTo("objectId", floorObjectId)
        .first();
    let floor = ParseObject.toOutputJSON(floorObject);
    let floorIsInCCure = floor.find(x=>x.floorname.length>=2 && x.system==800 && x.floorname.substring(0,2)!="D_")
    console.log("foorIsInCCure", floorIsInCCure, "floor", floor);
    return { floorIsInCCure, floor };
}

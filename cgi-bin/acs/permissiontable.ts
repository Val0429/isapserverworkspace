import {
    Action, Errors, Restful, ParseObject, TimeSchedule, Door, AccessLevel, Floor
} from 'core/cgi-package';

import { IPermissionTable, PermissionTable, PermissionTableDoor, AccessLevelinSiPass } from '../../custom/models'
import { siPassAdapter, cCureAdapter } from '../../custom/services/acsAdapter-Manager';

import { Log } from 'workspace/custom/services/log';
import { GetMigrationDataPermissionTable } from 'workspace/custom/modules/acs/ccure/Migration';
import { getAccessLevelReaders } from './accesslevel';

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
    
    let al = await checkSipassAccessLevel(ParseObject.toOutputJSON(data.inputType));
    console.log("access levels", al);
    if ( al.length <= 0) {
        throw Errors.throw(Errors.CustomNotExists, [`accessLevelIsNotInSipass`]);
    }

    let ag = {
        token: "-1",
        name: data.inputType.tablename,
        accessLevels: al
    };
    let accessLevels=data.inputType.accesslevels.map(x=>ParseObject.toOutputJSON(x));
    
    let {ccureClearance, acsAcessLevels, errors} = await checkCCureDevices(data.inputType.tablename, accessLevels);
    if(ccureClearance) checkCcureClearance(ccureClearance, acsAcessLevels, errors);
    if(errors.length>0)return {ccureClearance, acsAcessLevels, errors};
    
    Log.Info(`info`, `Sync to SiPass ${ JSON.stringify(ag) }`, data.user);
    let r1 = await siPassAdapter.postAccessGroup(ag);

    if(!r1["Token"]){
        errors.push({type:"errorFromSipass", message:r1});
        return { errors };
    }
    data.inputType.tableid = +r1["Token"];
    data.inputType.system = 0;
    var obj = new PermissionTable(data.inputType);
    //let ccurePermissionTable = 
    await obj.save(null, { useMasterKey: true });
    await Log.Info(`create`, `${data.inputType.tableid} ${data.inputType.tablename}`, data.user, false, "PermissionTable");
    

    /// 2) Output
    return { ccureClearance, acsAcessLevels, errors };
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IPermissionTable>;
type OutputR = Restful.OutputR<IPermissionTable>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(PermissionTable)
                .ascending("tablename")
                .include("accesslevels.elevator.reader")
                .include("accesslevels.elevatorgroup.elevators.reader")                
                .include("accesslevels.door")
                .include("accesslevels.floor")
                .include("accesslevels.floorgroup.floors")
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
    
    // 2.0 Modify Access Group
    let al = await checkSipassAccessLevel(ParseObject.toOutputJSON(data.inputType));
    if ( al.length <= 0) {
        throw Errors.throw(Errors.CustomNotExists, [`accessLevelIsNotInSipass`]);
    }

	let ag = {
        token: obj.get("tableid") + "",
        name: data.inputType.tablename,
        accessLevels: al
    };
    
    let accessLevels=data.inputType.accesslevels.map(x=>ParseObject.toOutputJSON(x));
    let {ccureClearance, acsAcessLevels, errors} = await checkCCureDevices(data.inputType.tablename, accessLevels);
    if(ccureClearance) checkCcureClearance(ccureClearance, acsAcessLevels, errors);    
    if(errors.length>0)return {ccureClearance, acsAcessLevels, errors};  
    
    Log.Info(`info`, `Sync to SiPass ${ JSON.stringify(ag) }`, data.user);
    await siPassAdapter.putAccessGroup(ag);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    await Log.Info(`update`, `${obj.get("tableid")} ${obj.get("tablename")}`, data.user, false, "PermissionTable");
    /// 3) Output
    return {ccureClearance, acsAcessLevels, errors};
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
    
   
    /// 2) Delete
    await obj.destroy({ useMasterKey: true });
    await Log.Info(`delete`, `${obj.get("tableid")} ${obj.get("tablename")}`, data.user, false, "PermissionTable");

    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;


async function checkSipassAccessLevel(data:any) {
    let al = [];
    if (data.accesslevels) {
        let accesslevels = await new Parse.Query(AccessLevel)
            .containedIn("objectId", data.accesslevels.map(x => x.objectId))
            .include("timeschedule").find();
        for (let levelGroup of accesslevels.map(x => ParseObject.toOutputJSON(x))) {
            console.log("levelGroup", levelGroup);
            let levelInSipass = await getAccessLevelInSipass(levelGroup);
            al.push(...levelInSipass);
        }
    }
    return al;
}

async function checkCCureDevices(tablename:string, accessLevels:any[]){
    let errors:any[]=[];
    let acsAcessLevels=[];
    let ccureClearances = await GetMigrationDataPermissionTable();    
    let ccureClearance = ccureClearances[tablename];
    console.log("ccureClearance", ccureClearance);
    
    let accessLevelIsNotInCCure="accessLevelIsNotInCCure";
    let clearanceIsNotInCCure="clearanceIsNotInCCure";

    for (let accesslevelInput of accessLevels) {
        let accesslevelObject = await new Parse.Query(AccessLevel).equalTo("objectId", accesslevelInput.objectId)
            .include("doorgroup.doors.readerin")
            .include("doorgroup.doors.readerout")
            .include("door.readerin")
            .include("door.readerout")
            .include("floor")
            .include("elevatorgroup.elevators.reader")
            .include("elevator.reader")
            .include("floorgroup.floors")
            .include("timeschedule")
            .first();
        let accesslevel = ParseObject.toOutputJSON(accesslevelObject);
        console.log("accesslevel", accesslevel)
        
        if(accesslevel.type=="door"){
            if(!accesslevel.door || !accesslevel.timeschedule)continue;
           
            //compare content with ccure door name and timename            
            let { doorIsInCCure, door } = getCCureDoor(accesslevel.door);            
            if(!doorIsInCCure) continue;
            acsAcessLevels.push(accesslevel);
            if (!ccureClearance) {
                errors.push({ type: clearanceIsNotInCCure });
            }
            else {
                let exists = ccureClearance.find(x => x.type == "door" && x.name == door.doorname && x.timespec == accesslevel.timeschedule.timename);
                if (!exists)
                    errors.push({ type: accessLevelIsNotInCCure, devicename: door.doorname, timename: accesslevel.timeschedule.timename });
            }
        }

        if(accesslevel.type=="doorGroup"){
            if(!accesslevel.doorgroup || !accesslevel.timeschedule)continue;
                        
            for(let doorid of accesslevel.doorgroup.doors){
                //compare content with ccure door name and timename                  
                let { doorIsInCCure, door } = getCCureDoor(doorid);
                if(!doorIsInCCure) continue;
                acsAcessLevels.push(accesslevel);
                if (!ccureClearance) {
                    errors.push({ type: clearanceIsNotInCCure });
                }
                else {
                    let exists = ccureClearance.find(x => x.type == "doorGroup" && x.name == accesslevel.doorgroup.groupname &&
                             x.timespec == accesslevel.timeschedule.timename && x.doors.find(y=>y.name==door.doorname));
                    if (!exists)
                        errors.push({ type: accessLevelIsNotInCCure, devicename: `${accesslevel.doorgroup.groupname}-${door.doorname}`, timename: accesslevel.timeschedule.timename });
                }
                 
            }            
        }

        if(accesslevel.type=="floor"){
            if(!accesslevel.elevator || !accesslevel.floor || !accesslevel.timeschedule)continue;
            
            //compare content with ccure floor name and timename            
            let { floorIsInCCure, floor } = getCCureFloor(accesslevel.floor);            
            if(!floorIsInCCure) continue;
            acsAcessLevels.push(accesslevel);
            if (!ccureClearance) {
                errors.push({ type: clearanceIsNotInCCure });
            }
            else {
                let exists = ccureClearance.find(x => x.type == "elevatorFloor" && x.elevator.name == accesslevel.elevator.elevatorname && 
                                x.timespec == accesslevel.timeschedule.timename && x.floor && x.floor.type=="floor" && x.floor.name == floor.floorname);
                if (!exists)
                    errors.push({ type: accessLevelIsNotInCCure, devicename: `${accesslevel.elevator.elevatorname}-${floor.floorname}`, timename: accesslevel.timeschedule.timename });
            }
            
        }
        if(accesslevel.type=="floorGroup"){
            if(!accesslevel.elevator || !(accesslevel.floorgroup && accesslevel.floorgroup.floors.length>0) || !accesslevel.timeschedule)continue;
            
            //compare content with ccure floor name and timename 
            for(let alFloor of accesslevel.floorgroup.floors){
                let { floorIsInCCure, floor } = getCCureFloor(alFloor);            
                if(!floorIsInCCure) continue;
                acsAcessLevels.push(accesslevel);
                if (!ccureClearance) {
                    errors.push({ type: clearanceIsNotInCCure });
                }
                else {
                    let exists = ccureClearance.find(x => x.type == "elevatorFloor" && x.elevator.name == accesslevel.elevator.elevatorname && 
                                    x.timespec == accesslevel.timeschedule.timename && x.floor  && x.floor.type=="floorGroup" && x.floors.find(y=>y.name == floor.floorname));
                    if (!exists)
                        errors.push({ type: accessLevelIsNotInCCure, devicename: `${accesslevel.elevator.elevatorname}-${floor.floorname}`, timename: accesslevel.timeschedule.timename });
                }
            }    
            
        }
    }
    return {ccureClearance, acsAcessLevels, errors};

    
}


function getCCureDoor(door: any) {
    let readers = [];
    if (door.readerin && door.readerin.length > 0)
        readers.push(...door.readerin);
    if (door.readerout && door.readerout.length > 0)
        readers.push(...door.readerout);
    let doorIsInCCure = readers.find(x=>x.readername.length>=2  && x.system==800 && x.readername.substring(0,2)!="D_")
    console.log("doorIsInCcure", doorIsInCCure, "readers", readers);
    return { doorIsInCCure, door };
}

function getCCureFloor(floor: any) {    
    let floorIsInCCure = floor.floorname.length>=2 && floor.system==800 && floor.floorname.substring(0,2)!="D_";
    console.log("foorIsInCCure", floorIsInCCure, "floor", floor);
    return { floorIsInCCure, floor };
}
function checkCcureClearance(ccureClearance:any[], acsAccessLevels:any[], errors:any[]){
    let accessLevelIsNotInAcs="accessLevelIsNotInAcs";
    for(let accessRule of ccureClearance){
        if(accessRule.type=="door" ){
            let isActive = Array.isArray(accessRule.devices) && accessRule.devices.find(x=>x.name.length>2 && x.name.substring(0,2)!="D_");
            if(!isActive) continue;

            let exists = acsAccessLevels.find(x => x.type == "door" && accessRule.name == x.door.doorname && accessRule.timespec == x.timeschedule.timename);
            if (!exists)
                errors.push({ type: accessLevelIsNotInAcs, devicename: accessRule.name, timename: accessRule.timespec });
        }
        if(accessRule.type=="doorGroup"){
            for(let door of accessRule.doors){
                let isActive = Array.isArray(door.devices) && door.devices.find(x=>x.name.length>2 && x.name.substring(0,2)!="D_");
                if(!isActive) continue;
                let exists = acsAccessLevels.find(x => x.type == "doorGroup" && accessRule.name == x.doorgroup.groupname &&
                accessRule.timespec == x.timeschedule.timename && x.doorgroup.doors.find(y=>door.name==y.doorname));
                if (!exists)
                    errors.push({ type: accessLevelIsNotInAcs, devicename: `${accessRule.name}-${door.name}`, timename: accessRule.timespec });
            }            
        }

        if(accessRule.type=="elevatorFloor" && accessRule.floor.type=="floor"){
                let isActive = accessRule.floor.name && accessRule.floor.name.length>2 && accessRule.floor.name.substring(0,2) != "D_";
                if(!isActive) continue;

                let exists = acsAccessLevels.find(x => x.type == "floor" && x.elevator.elevatorname == accessRule.elevator.name &&
                            accessRule.timespec == x.timeschedule.timename && 
                            (x.floor.floorname.substring(0,2)!="A_" ? x.floor.floorname: x.floor.floorname.substring(2, x.floor.floorname.length)) == accessRule.floor.name);
                if (!exists)
                    errors.push({ type: accessLevelIsNotInAcs, devicename: `${accessRule.elevator.name}-${accessRule.floor.name}`, timename: accessRule.timespec });
        }
        if(accessRule.type=="elevatorFloor" && accessRule.floor.type=="floorGroup"){
            for(let floor of accessRule.floor.floors){
                let isActive = floor.name.length>2 && floor.name.substring(0,2)!="D_";
                if(!isActive) continue;
                let exists = acsAccessLevels.find(x => x.type == "floorGroup" && x.elevator.elevatorname == accessRule.elevator.name &&
                            accessRule.timespec == x.timeschedule.timename && x.reader.find(y=>floor.name==(y.floorname.substring(0,2)!="A_" ? y.floorname: y.floorname.substring(2, y.floorname.length))));
                if (!exists)
                    errors.push({ type: accessLevelIsNotInAcs, devicename: `${accessRule.elevator.name}-${floor.name}`, timename: accessRule.timespec });
            }
        }
    }

    
}

async function getAccessLevelInSipass(accessLevel:any){
    let { readers, floors } = await getAccessLevelReaders(accessLevel);
    let results:any[]=[];
    if((accessLevel.type=="door" || accessLevel.type=="doorGroup") && readers.length>0){
        let sipassReaders = readers.map(x=>(x.get("readername").substring(0, 2)=="A_" ? x.get("readername").substring(2, x.get("readername").length) : x.get("readername"))+"_"+accessLevel.timeschedule.timename);
        console.log("readers in sipass", sipassReaders);
        results = await new Parse.Query(AccessLevelinSiPass).containedIn("name", sipassReaders).find();
    }
    else if((accessLevel.type=="floor" || accessLevel.type=="floorGroup" || accessLevel.type=="elevator" || accessLevel.type=="elevatorGroup") && floors.length>0){
        let sipassFloors = floors.map(x=>(x.get("floorname").substring(0, 2)=="A_" ? x.get("floorname").substring(2, x.get("floorname").length) : x.get("floorname"))+"_"+accessLevel.timeschedule.timename);
        console.log("floors in sipass", sipassFloors);
        results = await new Parse.Query(AccessLevelinSiPass).containedIn("name", sipassFloors).find();
    }
    return results.map(x=>ParseObject.toOutputJSON(x)).map(x=>{return{Token:x.token, Name:x.name}});
}
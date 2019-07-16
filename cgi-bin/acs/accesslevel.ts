import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject, TimeSchedule, Door
} from 'core/cgi-package';

import { Log } from 'helpers/utility';
import { IAccessLevel, AccessLevel } from '../../custom/models'
import { siPassAdapter } from '../../custom/services/acsAdapter-Manager';

var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "3-1_door_accesslevel_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IAccessLevel>;
type OutputC = Restful.OutputC<IAccessLevel>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Sync to ACS Services
    let rules = [] ;

    if (siPassAdapter.sessionToken == "")
        throw Errors.throw(Errors.CustomNotExists, [`SiPass Connect fail. Please contact system administrator!`]);
        
    if(data.inputType.reader && data.inputType.reader.length>0)
    for (let idx = 0; idx < data.inputType.reader.length; idx++) {
        let e = data.inputType.reader[idx];
        
        let r = {
            ObjectToken: e.get("readerid"),
            ObjectName: e.get("readername"),
            RuleType:2,
        }

        rules.push(r);
    }
    if(data.inputType.floor && data.inputType.floor.length>0)
    for (let idx = 0; idx < data.inputType.floor.length; idx++) {
        let e = data.inputType.floor[idx];
        
        let r = {
            ObjectToken: e.get("floorid"),
            ObjectName: e.get("floorname"),
            RuleType:4,
        }

        rules.push(r);
    }

    let d = {
        token: "-1",
        name: data.inputType.levelname,
        accessRule: rules,
        timeScheduleToken: data.inputType.timeschedule.get("timename")
    }

    let accessLevel = await siPassAdapter.postAccessLevel(d);
    Log.Info(`${this.constructor.name}`, `postAccessLevel ${data.inputType.levelid} ${data.inputType.levelname}`);

    /// 1) Create Object
    // let firstObj = await new Parse.Query(AccessLevel).descending("levelid").first();
    // let max = 0 ;
    // if ( firstObj != null)
    //     max = +firstObj.get("levelid") + 1 ;

    data.inputType.levelid = accessLevel["Token"] ;
    data.inputType.levelname = "name " + data.inputType.levelid ;

    var obj = new AccessLevel(data.inputType);
    await obj.save(null, { useMasterKey: true });

    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IAccessLevel>;
type OutputR = Restful.OutputR<IAccessLevel>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(AccessLevel);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    
    let filter = data.parameters as any;
    if(filter.timename){
        let tsQuery = new Parse.Query(TimeSchedule).matches("timename", new RegExp(filter.timename), "i");    
        query.matchesQuery("timeschedule", tsQuery);
    }
    if(filter.doorname){
        let tsDoor = new Parse.Query(Door).matches("doorname", new RegExp(filter.doorname), "i");    
        query.matchesQuery("door", tsDoor);
    }
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IAccessLevel>;
type OutputU = Restful.OutputU<IAccessLevel>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(AccessLevel).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`AccessLevel <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });

    Log.Info(`${this.constructor.name}`, `putAccessLevel ${obj.get("levelid")} ${obj.get("levelname")}`);

    /// 3) Sync to ACS Services
    let rules = [] ;
    for (let idx = 0; idx < data.inputType.reader.length; idx++) {
        let e = data.inputType.reader[idx];
        
        let r = {
            ObjectToken: e.get("readerid"),
            ObjectName: e.get("readername"),
            RuleToken:"12",
            RuleType:2,
            StartDate:null,
            EndDate:null,
            ArmingRightsId:null,
            ControlModeId:null
        }

        rules.push(r);
    }

    let d = {
        token: data.inputType.levelid + "",
        name: data.inputType.levelname,
        accessRule: rules,
        timeScheduleToken: data.inputType.timeschedule.get("timeid")
    }
    await siPassAdapter.putAccessLevel(d);

    /// 4) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IAccessLevel>;
type OutputD = Restful.OutputD<IAccessLevel>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(AccessLevel).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`AccessLevel <${objectId}> not exists.`]);
    /// 2) Delete

    Log.Info(`${this.constructor.name}`, `deleteAccessLevel ${obj.get("levelid")} ${obj.get("levelname")}`);

    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

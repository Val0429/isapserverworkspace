import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';

import { IAccessLevel, AccessLevel } from '../../custom/models'
import { SiPassAdapter } from '../../custom/services/acs/SiPass'

var action = new Action({
    loginRequired: false,
    permission: [RoleList.Admin]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IAccessLevel>;
type OutputC = Restful.OutputC<IAccessLevel>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new AccessLevel(data.inputType);
    await obj.save(null, { useMasterKey: true });

    /// 2) Sync to ACS Services
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

    var adapter = new SiPassAdapter();
    let d = {
        token: data.inputType.levelid,
        name: data.inputType.levelname,
        accessRule: rules,
        timeScheduleToken: data.inputType.timeschedule.get("timeid")
    }
    await adapter.postAccessLevel(d);

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

    var adapter = new SiPassAdapter();
    let d = {
        token: data.inputType.levelid,
        name: data.inputType.levelname,
        accessRule: rules,
        timeScheduleToken: data.inputType.timeschedule.get("timeid")
    }
    await adapter.putAccessLevel(d);

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
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

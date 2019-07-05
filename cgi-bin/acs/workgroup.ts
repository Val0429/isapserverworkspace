import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';

import { Log } from 'helpers/utility';
import { IWorkGroup, WorkGroup } from '../../custom/models'


var action = new Action({
    loginRequired: false,
    permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IWorkGroup>;
type OutputC = Restful.OutputC<IWorkGroup>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new WorkGroup(data.inputType);

    Log.Info(`${this.constructor.name}`, `postWorkGroup ${data.inputType.groupid} ${data.inputType.groupname}`);
    
    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IWorkGroup>;
type OutputR = Restful.OutputR<IWorkGroup>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(WorkGroup);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IWorkGroup>;
type OutputU = Restful.OutputU<IWorkGroup>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(WorkGroup).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`WorkGroup <${objectId}> not exists.`]);
    
    Log.Info(`${this.constructor.name}`, `putWorkGroup ${obj.get("groupid")} ${obj.get("groupname")}`);

    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IWorkGroup>;
type OutputD = Restful.OutputD<IWorkGroup>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(WorkGroup).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`WorkGroup <${objectId}> not exists.`]);

    Log.Info(`${this.constructor.name}`, `deleteWorkGroup ${obj.get("groupid")} ${obj.get("groupname")}`);

    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

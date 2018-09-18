import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import { Purposes, IPurposes } from './../../custom/models/purposes';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator, RoleList.TenantAdministrator, RoleList.TenantUser]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IPurposes>;
type OutputC = Restful.OutputC<IPurposes>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new Purposes(data.inputType);
    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IPurposes>;
type OutputR = Restful.OutputR<IPurposes>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Purposes);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.inputType);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IPurposes>;
type OutputU = Restful.OutputU<IPurposes>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Purposes).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Purposes <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IPurposes>;
type OutputD = Restful.OutputD<IPurposes>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Purposes).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Purposes <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

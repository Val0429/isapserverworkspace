import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';

import { IMember, Member } from '../../custom/models'


var action = new Action({
    loginRequired: false,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IMember>;
type OutputC = Restful.OutputC<IMember>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new Member(data.inputType);
    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IMember>;
type OutputR = Restful.OutputR<IMember>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Member);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IMember>;
type OutputU = Restful.OutputU<IMember>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Member).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Member <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IMember>;
type OutputD = Restful.OutputD<IMember>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Member).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Member <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
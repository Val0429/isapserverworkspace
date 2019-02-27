import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, UserType,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
    IUserTenantAdministrator
} from 'core/cgi-package';

import { Visitors, IVisitors, VisitorStatus } from './../../custom/models/visitors';
import { Companies } from './../../custom/models/companies';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.TenantAdministrator, RoleList.TenantUser]
});

const filter = { status: (value) => getEnumKey(VisitorStatus, value), company: false }

/// CRUD start /////////////////////////////////
/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IVisitors>;
type OutputR = Restful.OutputR<IVisitors>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// V0) get user company
    let company: Companies = (data.user.attributes as IUserTenantAdministrator).data.company;

    /// 1) Make Query
    var query = new Parse.Query(Visitors)
        .equalTo("company", company);

    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters, filter);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IVisitors>;
type OutputU = Restful.OutputU<IVisitors>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// V0) get user company
    let company: Companies = (data.user.attributes as IUserTenantAdministrator).data.company;

    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Visitors)
        .equalTo("company", company)
        .get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Visitors <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj, filter);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IVisitors>;
type OutputD = Restful.OutputD<IVisitors>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// V0) get user company
    let company: Companies = (data.user.attributes as IUserTenantAdministrator).data.company;

    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Visitors)
        .equalTo("company", company)
        .get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Visitors <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj, filter);
});
/// CRUD end ///////////////////////////////////

export default action;

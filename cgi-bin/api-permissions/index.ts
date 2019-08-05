import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import { APIPermissions, APIRoles, APITokens, IAPIPermissions, IAPIRoles, IAPITokens } from 'models/customRoles';


interface ICAPIPermissions {
    token: APITokens;
    role: APIRoles;
    data: IAPIPermissions;
}

var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken : "user_Permission_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<ICAPIPermissions>;
type OutputC = Restful.OutputC<ICAPIPermissions>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    let { token, role, data: value } = data.inputType;

    /// 1) Create Object
    let result = await APIPermissions.set(token, role, value);
    /// 2) Output
    return ParseObject.toOutputJSON(result);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IAPIPermissions>;
type OutputR = Restful.OutputR<IAPIPermissions>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(APIPermissions)
        .include("of").include("a").include("b").include("c").include("d");
    
        let filter = data.parameters as any;
    if(filter.role){
        console.log(filter.role);
        let apiRole = new APIRoles();
        apiRole.id=filter.role;
        query.equalTo("a", apiRole);
    }
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IAPIPermissions>;
type OutputU = Restful.OutputU<IAPIPermissions>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(APIPermissions).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`APIPermissions <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IAPIPermissions>;
type OutputD = Restful.OutputD<IAPIPermissions>;

action.delete<InputD, any>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    let parent = new APIRoles();
        parent.id = objectId;
        let permissions = await new Parse.Query(APIPermissions).equalTo("a", parent).find();
        ParseObject.destroyAll(permissions);
        return permissions.map(o=> ParseObject.toOutputJSON(o));
});
/// CRUD end ///////////////////////////////////

export default action;

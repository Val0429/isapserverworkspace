import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import { APIPermissions, APIRoles, APITokens, IAPIPermissions, IAPIRoles, IAPITokens } from 'models/customRoles';


var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator], 
    apiToken : "1-1_user_Permission_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IAPIRoles>;
type OutputC = Restful.OutputC<IAPIRoles>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    let dbRole = await new Parse.Query(APIRoles).equalTo("identifier", data.inputType.identifier).first();
    if (dbRole!= null) {
        throw Errors.throw(Errors.CustomNotExists, [`Role <${data.inputType.identifier}> is duplicate.`]);
    }

    var obj = new APIRoles(data.inputType);
    await obj.save(null, { useMasterKey: true });
    
    await savePermissions(data.parameters, obj);
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IAPIRoles>;
type OutputR = Restful.OutputR<IAPIRoles>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    let page = data.parameters.paging.page || 1;
    let pageSize = data.parameters.paging.pageSize || 10;
    var query = new Parse.Query(APIRoles).limit(Number.MAX_SAFE_INTEGER);
    let output = await query.find();
    let filter = data.parameters as any;
    //must implement regex on mongo query
    if(filter.name){
        output = output.filter(x=>x.get("identifier").search(new RegExp(filter.name, "i"))>=0);
    }    
    let total = output.length;
    let results = output.splice((page-1)*pageSize, pageSize).map(x=>ParseObject.toOutputJSON(x));
    
    return {
        paging:{
            page,
            pageSize,
            total,
            totalPages:Math.ceil(total / pageSize)
        },
        results
    }
    
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IAPIRoles>;
type OutputU = Restful.OutputU<IAPIRoles>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(APIRoles).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`APIRoles <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    await deletePermissions(obj);
    await savePermissions(data.parameters, obj);
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IAPIRoles>;
type OutputD = Restful.OutputD<IAPIRoles>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(APIRoles).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`APIRoles <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    //destroy child permissions
    await deletePermissions(obj);
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
async function deletePermissions(obj: APIRoles) {
    let permissions = await new Parse.Query(APIPermissions).equalTo("a", obj).find();
    await ParseObject.destroyAll(permissions);
}

async function savePermissions(parameters: any, obj: APIRoles) {
    if (!parameters.permissions || parameters.permissions.length <= 0) return;
    
    //set permissions
    for (let permission of parameters.permissions) {
        let token = new APITokens();
        token.id = permission.objectId;
        let value = permission.value;             
        let result = await APIPermissions.set(token, obj, value);
    }
    
}


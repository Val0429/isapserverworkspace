import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, UserType,
    RoleInterfaceLiteralList, IUserSystemAdministrator, IUserAdministrator, IUserTenantAdministrator, IUserTenantUser,
    PartialIUserSystemAdministrator, PartialIUserAdministrator, PartialIUserTenantAdministrator, PartialIUserTenantUser, PartialIUserKiosk,
    getEnumKey, getEnumKeyArray, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
    deepMerge
} from 'core/cgi-package';

import { permissionMapU, getAvailableRoles } from './core';

import ast from './../../../../services/ast-services/ast-client';

export type InputU = Restful.InputU<IUser<any>>;
export type OutputU = Restful.OutputU<IUser<any>>;

export default function(action: Action) {

function validate(currentUser: Parse.User, targetUser: Parse.User) {
    /// 1) Get available roles
    let availableRoles = getAvailableRoles(currentUser.get("roles"), permissionMapU);
    let targetRoles: RoleList[] = targetUser.get("roles").map( (role) => role.getName() );

    do {
        /// 2) It's ok to modify self
        if (currentUser.id === targetUser.id) break;


        /// 3) target role should complete intersect with available roles
        let invalidRoles = targetRoles.filter( (role) => availableRoles.indexOf(role) < 0 );
        if (invalidRoles.length > 0) throw Errors.throw(Errors.PermissionDenied);

    } while(0);

    return targetRoles;
}

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    const { objectId } = data.inputType;

    /// 1) Get User
    let user = await new Parse.Query(Parse.User)
        .include("roles")
        .get(objectId);
    if (!user) throw Errors.throw(Errors.CustomNotExists, [`User <${objectId}> not exists.`]);

    /// 2) Check available
    let targetRoles = validate(data.user, user);

    /// 3) Trigger param validation on roles
    for (let targetRole of targetRoles) {
        let rtn = await ast.requestValidation(`Partial${RoleInterfaceLiteralList[targetRole]}`, data.parameters);
        data.inputType = deepMerge(data.inputType, rtn);
    }

    /// 4) Perform modify
    /// 4.0) Prepare params to feed in
    var input = { ...data.inputType };
    delete input.username;
    delete input.roles;
    /// 4.1) Modify
    await user.save(input, {useMasterKey: true});

    /// 4.2) Hide password
    user.set("password", undefined);

    return ParseObject.toOutputJSON(user);
});

}
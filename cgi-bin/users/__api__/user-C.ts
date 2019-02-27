import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, UserType,
    RoleInterfaceLiteralList, IUserSystemAdministrator, IUserAdministrator, IUserTenantAdministrator, IUserTenantUser,
    getEnumKey, getEnumKeyArray, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
    deepMerge
} from 'core/cgi-package';

import { permissionMapC, getAvailableRoles } from './core';

import ast from './../../../../services/ast-services/ast-client';

export type InputC = Restful.InputC<IUser<any>>;
export type OutputC = Restful.OutputC<IUser<any>>;

export default function(action: Action) {

function validateRoles(availableRoles: RoleList[], userRoles: RoleList[]) {
    let result = userRoles.filter( (role) => availableRoles.indexOf(role) < 0 );
    if (result.length === 0) return;
    throw Errors.throw(Errors.CustomUnauthorized, [`Permission denied for roles <${getEnumKeyArray(RoleList, result).join(", ")}>.`]);
}

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    const { roles: userRoles } = data.inputType;

    /// 1) Get available roles
    let availableRoles = getAvailableRoles(data.role, permissionMapC);
    /// 2) Validate UserRoles
    validateRoles(availableRoles, userRoles);

    /// 3) Trigger param validation on roles
    for (let userRole of userRoles) {
        let rtn = await ast.requestValidation(RoleInterfaceLiteralList[userRole], data.parameters);
        data.inputType = deepMerge(data.inputType, rtn);
    }

    /// 4) Create. Signup User
    let user: Parse.User = new Parse.User();
    try {
        user = await user.signUp({
            ...data.inputType,
            roles: undefined
        }, { useMasterKey: true });
    } catch(e) {
        throw Errors.throw(Errors.CustomBadRequest, [e]);
    }

    /// 4.1) Add to Role
    var roleAry = [];
    for (var name of userRoles) {
        var r = await new Parse.Query(Parse.Role)
            .equalTo("name", name)
            .first();
        r.getUsers().add(user);
        r.save(null, {useMasterKey: true});
        roleAry.push(r);
    }

    /// 5) Add Role to User
    user.set("roles", roleAry);
    await user.save(null, { useMasterKey: true });

    return ParseObject.toOutputJSON(user);
});

}

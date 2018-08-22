import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, UserType,
    RoleInterfaceLiteralList, IUserSystemAdministrator, IUserAdministrator, IUserTenantAdministrator, IUserTenantUser,
    getEnumKey, getEnumKeyArray, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import { permissionMapC } from './core';

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

    /// 1) Get Current User Roles
    let roles = data.role.map( (role) => role.getName() );
    /// 2) Get Available Create Roles
    let availableRoles: RoleList[] = roles.reduce( (final, data) => {
        let permissions = permissionMapC[data];
        final.splice(final.length, 0, ...permissions);
        return final;
    }, []);
    /// 3) Validate UserRoles
    validateRoles(availableRoles, userRoles);

    /// 4) Trigger param validation on roles
    for (let userRole of userRoles) {
        let rtn = await ast.requestValidation(RoleInterfaceLiteralList[userRole], data.parameters);
    }
    
    /// 5) Create. Signup User
    let user: Parse.User = new Parse.User();
    try {
        user = await user.signUp({
            ...data.inputType,
            roles: undefined
        }, { useMasterKey: true });
    } catch(e) {
        throw Errors.throw(Errors.CustomBadRequest, [e]);
    }

    /// 5.1) Add to Role
    var roleAry = [];
    for (var name of userRoles) {
        var r = await new Parse.Query(Parse.Role)
            .equalTo("name", name)
            .first();
        r.getUsers().add(user);
        r.save(null, {useMasterKey: true});
        roleAry.push(r);
    }

    /// 6) Add Role to User
    user.set("roles", roleAry);
    await user.save(null, { useMasterKey: true });

    return ParseObject.toOutputJSON(user);
});

}

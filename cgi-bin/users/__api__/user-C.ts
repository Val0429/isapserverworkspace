import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, UserType,
    RoleInterfaceLiteralList, IUserSystemAdministrator, IUserAdministrator, IUserTenantAdministrator, IUserTenantUser,
    getEnumKey, getEnumKeyArray, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';



import ast from './../../../../services/ast-services/ast-client';

export type InputC = Restful.InputC<IUser<any>>;
export type OutputC = Restful.OutputC<IUser<any>>;

/**
 * SystemAdministrator: Can only create SystemAdministrator, Administrator.
 * Administrator: Can only crate TenantAdministrator.
 * TenantAdministrator: Can only create TenantUser.
 */
const permissionMapC = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator],
    [RoleList.Administrator]: [RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [RoleList.TenantUser]
}

/**
 * SystemAdministrator: Can only see SystemAdministrator, Administrator.
 * Administrator: Can only see TenantAdministrator and self.
 * TenantAdministrator: Can see everything in same company.
 * TenantUser: Can only see his invited Visitor.
 */
const permissionMapR = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator],
    [RoleList.Administrator]: [RoleList.Administrator, RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [RoleList.TenantAdministrator, RoleList.TenantUser]
}

/**
 * SystemAdministrator: Can only update SystemAdministrator, Administrator.
 * Administrator: Can only update TenantAdministrator and self.
 * TenantAdministrator: Can only update TenantUser, and self.
 * TenantUser: Can only update Visitors.
 */
const permissionMapU = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator],
    [RoleList.Administrator]: [RoleList.Administrator, RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [RoleList.TenantAdministrator, RoleList.TenantUser]
}
/**
 * SystemAdministrator: Can only delete Administrator.
 * Administrator: Can only delete TenantAdministrator. All TenantUser created by it should be deleted accordingly.
 * TenantAdministrator: Can only delete TenantUser created by him. All visitors created by it should be deleted accordingly.
 * TenantUser: Can only delete Visitors created by him.
 */
const permissionMapD = {
    [RoleList.SystemAdministrator]: [RoleList.Administrator],
    [RoleList.Administrator]: [RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [RoleList.TenantUser]
}

export default function(action: Action) {

// const permissionMapC = {
//     [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator],
//     [RoleList.Administrator]: [RoleList.TenantAdministrator],
//     [RoleList.TenantAdministrator]: [RoleList.TenantUser]
// }

function validateRoles(availableRoles: RoleList[], userRoles: RoleList[]) {
    let result = userRoles.filter( (role) => availableRoles.indexOf(role) < 0 );
    if (result.length === 0) return;
    throw Errors.throw(Errors.CustomUnauthorized, [`Permission denied for roles <${getEnumKeyArray(RoleList, result).join(", ")}>.`]);
}

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    console.time('got')
    console.time('got1')
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
    console.timeEnd('got1')

    /// 4) Trigger param validation on roles
    for (let userRole of userRoles) {
        let type = RoleInterfaceLiteralList[userRole];
        let rtn = await ast.requestValidation({
            path: __filename,
            type
        }, data.parameters);
    }
    // var rtn = await ast.requestValidation({
    //     path: __filename,
    //     type
    // }, req.parameters);
    
     console.timeEnd('got')

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

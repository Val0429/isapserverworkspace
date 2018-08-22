import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, UserType,
    RoleInterfaceLiteralList, IUserSystemAdministrator, IUserAdministrator, IUserTenantAdministrator, IUserTenantUser,
    getEnumKey, getEnumKeyArray, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import { permissionMapR, getAvailableRoles } from './core';
import { Companies } from './../../../custom/models/companies';

// export type InputC = Restful.InputC<IUser<any>>;
// export type OutputC = Restful.OutputC<IUser<any>>;

// export default function(action: Action) {

// function validateRoles(availableRoles: RoleList[], userRoles: RoleList[]) {
//     let result = userRoles.filter( (role) => availableRoles.indexOf(role) < 0 );
//     if (result.length === 0) return;
//     throw Errors.throw(Errors.CustomUnauthorized, [`Permission denied for roles <${getEnumKeyArray(RoleList, result).join(", ")}>.`]);
// }

// action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
//     const { roles: userRoles } = data.inputType;

//     /// 1) Get Current User Roles
//     let roles = data.role.map( (role) => role.getName() );
//     /// 2) Get Available Create Roles
//     let availableRoles: RoleList[] = roles.reduce( (final, data) => {
//         let permissions = permissionMapC[data];
//         final.splice(final.length, 0, ...permissions);
//         return final;
//     }, []);
//     /// 3) Validate UserRoles
//     validateRoles(availableRoles, userRoles);

//     /// 4) Trigger param validation on roles
//     for (let userRole of userRoles) {
//         let rtn = await ast.requestValidation(RoleInterfaceLiteralList[userRole], data.parameters);
//     }
    
//     /// 5) Create. Signup User
//     let user: Parse.User = new Parse.User();
//     try {
//         user = await user.signUp({
//             ...data.inputType,
//             roles: undefined
//         }, { useMasterKey: true });
//     } catch(e) {
//         throw Errors.throw(Errors.CustomBadRequest, [e]);
//     }

//     /// 5.1) Add to Role
//     var roleAry = [];
//     for (var name of userRoles) {
//         var r = await new Parse.Query(Parse.Role)
//             .equalTo("name", name)
//             .first();
//         r.getUsers().add(user);
//         r.save(null, {useMasterKey: true});
//         roleAry.push(r);
//     }

//     /// 6) Add Role to User
//     user.set("roles", roleAry);
//     await user.save(null, { useMasterKey: true });

//     return ParseObject.toOutputJSON(user);
// });

// }


export type InputR = Restful.InputR<IUser<any>>;
export type OutputR = Restful.OutputR<IUser<any>>;

export default function(action: Action) {

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Get available roles
    let availableRoles = getAvailableRoles(data.role, permissionMapR);
    /// 1.1) Get Current User Roles
    let currentUserRoles = data.role.map( (role) => role.getName() );

    /// 2) Make into Parse.Role
    let roles = await new Parse.Query(Parse.Role).find();
    let highest: number = 10000;
    let matchingRoles = roles.filter( (role) => availableRoles.indexOf(role.getName() as RoleList) >= 0 );
    availableRoles.forEach( (role) => highest = Math.min(+role, highest) );
    let prohibitRoles = roles.filter( (role) => {
        let key = +role.getName();
        return key < highest || key >= 70;      /// filter out Kiosk role
    });

    /// 2) Make query
    let query = new Parse.Query(Parse.User)
        .containedIn("roles", matchingRoles)
        .notContainedIn("roles", prohibitRoles)
        .include("roles")
        .include("data.company")
        .include("data.floor")

    /// 3) Special rule: TenantAdministrator can only see others in same company
    if (
        currentUserRoles.indexOf( RoleList.TenantAdministrator ) >= 0
    ) {
        let company: Companies = (data.user.attributes as IUserTenantAdministrator).data.company;
        query.equalTo("data.company.objectId", company.id);
    }

    return Restful.Pagination(query, data.inputType);
});

}

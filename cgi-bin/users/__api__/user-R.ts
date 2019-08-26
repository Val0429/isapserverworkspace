import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, UserType,
    RoleInterfaceLiteralList, IUserSystemAdministrator, IUserAdministrator, IUserTenantAdministrator, IUserTenantUser,
    getEnumKey, getEnumKeyArray, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import { permissionMapR, getAvailableRoles } from './core';


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
        .include("data.floor");

    /// 3) Special rule: TenantAdministrator can only see others in same company
    if (
        currentUserRoles.indexOf( RoleList.TenantAdministrator ) >= 0
    ) {
        let company: any/*Companies*/ = (data.user.attributes as IUserTenantAdministrator).data.company;
        query.equalTo("data.company.objectId", company.id);
    }

    return Restful.Pagination(query, data.parameters);
});

}

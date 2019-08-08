import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, getEnumKeyArray, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.TenantAdministrator]
});

/// R: get roles //////////////////////////
import { permissionMapC } from './../users/__api__/core';
action.get( async (data) => {
    let roles = [];
    for (let role of data.role) {
        roles = [...roles, ...permissionMapC[role.getName()]];
    }
    roles.filter( (data, index) => roles.indexOf(data) === index );
    roles = roles.sort( (a, b) => a-b );
    return getEnumKeyArray(RoleList, roles);
});
///////////////////////////////////////////

export default action;

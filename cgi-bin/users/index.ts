import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import userC, { InputC, OutputC } from './__api__/user-C';
import userR, { InputR, OutputR } from './__api__/user-R';
import userU, { InputU, OutputU } from './__api__/user-U';
import userD, { InputD, OutputD } from './__api__/user-D';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.TenantAdministrator, RoleList.TenantUser]
});

/// C: create users ///////////////////////
userC(action);
///////////////////////////////////////////

/// R: get users //////////////////////////
userR(action);
///////////////////////////////////////////

/// U: modify users ///////////////////////
userU(action);
///////////////////////////////////////////

/// D: delete users ///////////////////////
userD(action);
///////////////////////////////////////////

export default action;

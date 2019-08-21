import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, UserType,
    Action, Errors, Config,
    Events, Flow1Invitations, IFlow1Invitations,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject, ActionParam
} from 'core/cgi-package';

var action = new Action({
    loginRequired: true,
    permission: [ Config.vms.flow === "Flow2" ? RoleList.Administrator : undefined ]
});

/********************************
 * R: get object
 ********************************/
action.get(async (data) => {
    /// placeholder api
    return "success" as any;
});

export default action;
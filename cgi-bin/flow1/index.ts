import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, UserType,
    Action, Errors, Config,
    Events, Flow1Invitations, IFlow1Invitations,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject, ActionParam, Flow1Visitors, Flow1Companies, Flow1VisitorStatus, EventFlow1InvitationComplete, Flow1Purposes,
} from 'core/cgi-package';

var action = new Action({
    loginRequired: true,
    permission: [ Config.vms.flow === "Flow1" ? RoleList.Administrator : undefined ]
});

/********************************
 * R: get object
 ********************************/
action.get(async (data) => {
    /// placeholder api
    return "success" as any;
});

export default action;
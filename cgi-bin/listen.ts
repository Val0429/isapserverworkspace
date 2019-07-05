import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';
import { KeepAliveHost } from 'helpers/keep-alive-host';

export const kaListen = new KeepAliveHost("/Listen");

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

action.ws( async (data) => {
    kaListen.next(data);
});

export default action;

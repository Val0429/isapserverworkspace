import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject, kaListen
} from 'core/cgi-package';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

action.ws( async (data) => {
    kaListen.next(data);
});

export default action;

import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList, ParseObject,
    Action, Errors,
} from 'core/cgi-package';

export interface Input {
    url: string;
}

var action = new Action<Input>({
    loginRequired: false,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator]
});

action.get({inputType: "Input"}, async (data) => {
    
});

export default action;

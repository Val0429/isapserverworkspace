import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    Restful, EventSubjects
} from 'core/cgi-package';

import { ScheduleActionEmail, ScheduleActionEmailResult } from 'models/schedulers/actions';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator, RoleList.SystemAdministrator]
});

export interface Input {
    email: string;
}

action.post<Input>({
    inputType: "Input"
}, async (data) => {
    let result = await new ScheduleActionEmail().do({
        subject: "test subject from VMS",
        body: "test body from VMS",
        to: [data.inputType.email]
    });

    return "";
});
/////////////////////////////////////////////////////

export default action;
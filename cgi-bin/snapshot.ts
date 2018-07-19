import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from 'core/cgi-package';

import frs from 'workspace/custom/services/frs-service';


export interface Input {
    sessionId: string;
    image: string;
}

var action = new Action<Input>({
    loginRequired: true,
    requiredParameters: ["image"]
});

action.get(async (data) => {
    await frs.snapshot(data.parameters.image, data.response);

    return;
});

export default action;
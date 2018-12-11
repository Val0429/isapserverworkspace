import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from 'core/cgi-package';
import { promisify } from 'bluebird';
import * as fs from 'fs';
import * as p from 'path';

import frs from 'workspace/custom/services/frs-service';


export interface Input {
    sessionId: string;
    image: string;
}

var action = new Action<Input>({
    loginRequired: false,
    // requiredParameters: ["image"]
});

action.get(async (data) => {
    /// load from local
    let path = p.resolve(`${__dirname}/../custom/files/snapshots/${data.parameters.image}`);

    let exists = await new Promise((resolve) => fs.exists(path, (exists) => resolve(exists)));
    if (exists === true) {
        await new Promise((resolve) => data.response.sendFile(path, null, (err) => resolve()));
        return;
    }

    /// load from FRS
    await frs.snapshot(data.parameters.image, data.response);

    return;
});

export default action;
import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from 'core/cgi-package';

import { Observable } from 'rxjs';
import frs from 'workspace/custom/services/frs-service';
import { RecognizedUser, UnRecognizedUser } from 'workspace/custom/services/frs-service/core';
import { filterFace } from 'workspace/custom/services/frs-service/filter-face';

export interface Input {
    sessionId: string;
    start?: number;
    end?: number;
}

var action = new Action<Input>({
    loginRequired: true,
});

action.ws(async (data) => {
    var socket = data.socket;

    socket.io.on("close", () => {
        subscription && subscription.unsubscribe();
    });

    let start = data.parameters.start ? +data.parameters.start : null;
    let end = data.parameters.end ? +data.parameters.end : null;
    var subscription = frs.lastImages(start, end, { excludeFaceFeature: true })
        .subscribe({
            next: (data) => {
                socket.send(JSON.stringify(data));
            },
            complete: () => {
                socket.closeGracefully();
            }
        })
});

export default action;
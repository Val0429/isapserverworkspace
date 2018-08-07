import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from 'core/cgi-package';

import { Observable } from 'rxjs';
import { sjRecognizedUser, sjNonRecognizedUser, RecognizedUser, NonRecognizedUser } from 'workspace/custom/services/frs-service';
import frs from 'workspace/custom/services/frs-service';

export interface Input {
    sessionId: string;
    start: number;
    end: number;
}

var action = new Action<Input>({
    loginRequired: true,
});

action.ws(async (data) => {
    var socket = data.socket;

    socket.io.on("close", () => {
        subscription && subscription.unsubscribe();
    });

    var subscription = frs.lastImages(data.parameters.start, data.parameters.end)
        .subscribe({
            next: (data) => {
                /// workaround for test
                data = { ...data, face_feature: undefined };
                socket.send(JSON.stringify(data));
            },
            complete: () => {
                socket.closeGracefully();
            }
        })
});

export default action;
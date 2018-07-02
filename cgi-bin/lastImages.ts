import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from './../../core/cgi-package';

import { Observable } from 'rxjs';
import { sjRecognizedUser, sjNonRecognizedUser, RecognizedUser, NonRecognizedUser } from './../custom/services/frs-service';
import frs from './../custom/services/frs-service';

export interface Input {
    sessionId: string;
}

var action = new Action<Input>({
    loginRequired: true,
});

action.ws(async (data) => {
    var socket = data.socket;

    socket.io.on("close", () => {
        subscription && subscription.unsubscribe();
    });

    var subscription = frs.lastImages()
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
import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from './../../core/cgi-package';

import { Observable } from 'rxjs';
import { sjRecognizedUser, sjNonRecognizedUser } from './../custom/services/frs-service';

export interface Input {
    sessionId: string;
}

var action = new Action<Input>({
    loginRequired: true
});

action.ws(async (data) => {
    var socket = data.socket;
    socket.on("close", () => {
        subscription.unsubscribe();
    });

    var subscription = Observable.merge(sjRecognizedUser, sjNonRecognizedUser)
        .subscribe( (data) => {
            /// workaround for test
            data = { ...data, face_feature: undefined };
            socket.send(JSON.stringify(data));
        });
});

export default action;
import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from 'core/cgi-package';

import { Observable } from 'rxjs';
import frs, { sjRecognizedUser, sjUnRecognizedUser } from 'workspace/custom/services/frs-service';

export interface Input {
    sessionId: string;
}

var action = new Action<Input>({
    loginRequired: true
});

action.ws(async (data) => {
    var socket = data.socket;
    socket.io.on("close", () => {
        subscription.unsubscribe();
    });

    // var subscription = Observable.merge(sjRecognizedUser, sjUnRecognizedUser)
    //     .subscribe( (data) => {
    //         /// workaround for test
    //         data = { ...data, face_feature: undefined };
    //         socket.send(JSON.stringify(data));
    //     });

    let subscription = frs.sjLiveFace
        .subscribe( (data) => {
            socket.send( JSON.stringify({...data, face_feature: undefined}) );
        });
});

export default action;
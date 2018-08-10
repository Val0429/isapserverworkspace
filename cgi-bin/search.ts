import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from 'core/cgi-package';

import { Observable } from 'rxjs';
import { RecognizedUser, UnRecognizedUser } from 'workspace/custom/services/frs-service';
import frs from 'workspace/custom/services/frs-service';

export interface Input {
    sessionId: string;
    starttime: Date;
    endtime: Date;
    face: RecognizedUser | UnRecognizedUser;
}

var action = new Action<Input>({
    loginRequired: true,
    requiredParameters: ["starttime", "endtime", "face"]
});

action.ws(async (data) => {
    var socket = data.socket;

    // console.log('starttime', new Date(+data.parameters.starttime), 'endtime', new Date(+data.parameters.endtime));

    socket.io.on("close", () => {
        subscription && subscription.unsubscribe();
    });

    var subscription = frs.search(eval(`(${data.parameters.face})`), <any>data.parameters.starttime, <any>data.parameters.endtime)
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
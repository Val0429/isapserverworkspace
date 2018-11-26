import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from 'core/cgi-package';
import { aliveKiosk, sjRealtimeKiosk } from './keepalive';

export interface Input {
    sessionId: string;
}

export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator]
})
.ws(async (data) => {
    let { user, socket } = data;

    socket.send(aliveKiosk);
    let subscription = sjRealtimeKiosk.subscribe( (kioskRealtime) => {
        socket.send(kioskRealtime);
    });

    socket.io.on("close", () => {
        subscription.unsubscribe();
    });
});
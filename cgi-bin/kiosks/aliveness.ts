import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
} from 'core/cgi-package';
import { getAliveKiosk, sjRealtimeKiosk } from './keepalive';

export interface Input {
    sessionId: string;
}

/**
 * Websocket for real-time Kiosks aliveness.
 */
export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator]
})
.ws(async (data) => {
    let { user, socket } = data;

    socket.send( getAliveKiosk().map( data => data.instance ) );
    let subscription = sjRealtimeKiosk.subscribe( (kioskRealtime) => {
        socket.send({ ...kioskRealtime, socket: undefined});
    });

    socket.io.on("close", () => {
        subscription.unsubscribe();
    });
});

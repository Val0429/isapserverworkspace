import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
} from 'core/cgi-package';
import { Subject } from 'rxjs';
import { KeepAliveHost } from 'helpers/keep-alive-host';

export interface Input {
    sessionId: string;
}

export enum KioskAliveness {
    Offline,
    Online
}
export interface KioskRealtime {
    alive: KioskAliveness;
    kiosk: Parse.User;
}

let host = new KeepAliveHost("Kiosk");
export const sjRealtimeKiosk = host.getAliveObservable();
export const getAliveKiosk = () => host.list();

/**
 * Websocket for single Kiosk to report alive.
 */

export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.ws(async (data) => {
    host.next(data);
});

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

// export const sjRealtimeKiosk: Subject<KioskRealtime> = new Subject<KioskRealtime>();
// export const aliveKiosk: Parse.User[] = [];

export default new Action<Input>({
    loginRequired: true,
    permission: [RoleList.Kiosk]
})
.ws(async (data) => {
    host.next(data);
    // let { user, socket } = data;
    
    // /// when kiosk alive, check is already valid
    // let found: boolean = aliveKiosk.find( (kiosk) => {
    //     return kiosk.id === user.id ? true : false
    // }) !== undefined;
    // if (found) throw Errors.throw(Errors.CustomBadRequest, ["Cannot keep alive single kiosk multiple times."]);

    // /// add
    // aliveKiosk.push(user);
    // /// send to pipeline
    // sjRealtimeKiosk.next({ alive: KioskAliveness.Online, kiosk: user })

    // socket.io.on("close", () => {
    //     /// remove kiosk
    //     let idx = aliveKiosk.findIndex( (kiosk) => {
    //         return kiosk.id === user.id ? true : false
    //     });
    //     if (idx < 0) return;

    //     /// remove
    //     let kiosk = aliveKiosk.splice(idx, 1)[0];
    //     /// send to pipeline
    //     sjRealtimeKiosk.next({ alive: KioskAliveness.Offline, kiosk });
    // });
});
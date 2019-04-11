import { IUser, Action, Restful, RoleList, Errors, Socket, UserHelper, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Rx from 'rxjs';

let action = new Action({
    loginRequired: true,
    permission: [],
});

export default action;

/**
 * Action WebSocket
 */
action.ws(async (data) => {
    let _socket: Socket = data.socket;

    let timeSecond: number = Config.core.sessionExpireSeconds / 2;
    let stop$: Rx.Subject<{}> = new Rx.Subject();
    let timer$: Rx.Observable<number> = Rx.Observable.interval(timeSecond * 1000).takeUntil(stop$);

    timer$.subscribe({
        next: async () => {
            UserHelper.extendSessionExpires(data.session.id);
        },
    });

    _socket.io.on('close', () => {
        stop$.next();
    });
});
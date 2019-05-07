import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IWs, IDB } from '../../custom/models';
import { Print, PeopleCounting } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Rx from 'rxjs';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin, RoleList.User],
});

export default action;

/**
 * Action WebSocket
 */
interface IPushData {
    floorId: string;
    areaId: string;
    in: number;
    out: number;
}

enum EPushMode {
    'floor',
    'stop',
}
export const push$: Rx.Subject<IPushData[]> = new Rx.Subject();

action.ws(async (data) => {
    try {
        let _socket: Socket = data.socket;

        let _mode: EPushMode = EPushMode.stop;
        let _id: string = '';

        let counts: IPushData[] = [];

        let send$: Rx.Subject<{}> = new Rx.Subject();
        send$.subscribe({
            next: async (x) => {
                try {
                    if (_mode !== EPushMode.stop) {
                        let _counts = DataFilter(counts, _mode, _id);
                        if (_counts.length > 0) {
                            _socket.send(_counts);
                        }
                    }
                } catch (e) {
                    Print.Log(e, new Error(), 'error');
                }
            },
        });

        push$.subscribe({
            next: async (x) => {
                try {
                    counts = x;

                    send$.next();
                } catch (e) {
                    Print.Log(e, new Error(), 'error');
                }
            },
        });

        _socket.io.on('message', async (data) => {
            try {
                let _input: IWs<any> = JSON.parse(data);

                if (_input.type === EPushMode[EPushMode.stop]) {
                    _mode = EPushMode.stop;
                    _id = '';
                    return;
                }
                if (_input.type === EPushMode[EPushMode.floor]) {
                    _mode = EPushMode.floor;
                    _id = _input.content;
                }

                send$.next();
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        });
    } catch (e) {
        Print.Log(e, new Error(), 'error');
    }
});

/**
 * Filter
 * @param counts
 * @param mode
 * @param id
 */
function DataFilter(counts: IPushData[], mode: EPushMode, id: string): IPushData[] {
    try {
        let _counts: IPushData[] = counts;

        if (id !== '*' && mode === EPushMode.floor) {
            _counts = _counts.filter((value, index, array) => {
                return value.floorId === id;
            });
        }

        return _counts;
    } catch (e) {
        throw e;
    }
}

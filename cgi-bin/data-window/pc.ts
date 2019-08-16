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
    inToday: number;
    outToday: number;
}

enum EPushMode {
    'floor',
    'stop',
}
export const push$: Rx.Subject<IPushData> = new Rx.Subject();

action.ws(async (data) => {
    try {
        let _socket: Socket = data.socket;

        let _mode: EPushMode = EPushMode.stop;
        let _id: string = '';

        let counts: IPushData[] = [];

        let stop$: Rx.Subject<{}> = new Rx.Subject();

        let send$: Rx.Subject<IPushData[]> = new Rx.Subject();
        send$
            .debounceTime(1000)
            .takeUntil(stop$)
            .subscribe({
                next: async (x) => {
                    try {
                        if (_mode !== EPushMode.stop) {
                            let _x = DataFilter(x, _mode, _id);
                            if (_x.length > 0) {
                                _socket.send(_x);
                            }
                        }
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
                },
            });

        push$.takeUntil(stop$).subscribe({
            next: async (x) => {
                try {
                    let count = counts.find((n) => n.areaId === x.areaId);
                    if (!count) {
                        counts.push(x);
                    } else {
                        count.in = x.in;
                        count.out = x.out;
                        count.inToday = x.inToday;
                        count.outToday = x.outToday;
                    }

                    send$.next(counts);
                } catch (e) {
                    Print.Log(e, new Error(), 'error');
                }
            },
        });

        _socket.io.on('close', (x) => {
            stop$.next();
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

                counts = await GetReport();

                send$.next(counts);
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
        if (!counts) {
            return [];
        }

        let _counts: IPushData[] = JSON.parse(JSON.stringify(counts));

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

/**
 * Get report
 */
async function GetReport(): Promise<IPushData[]> {
    try {
        let hour: Date = GetDate(Enum.ESummaryType.hour, new Date());
        let day: Date = GetDate(Enum.ESummaryType.day, new Date());

        let query: Parse.Query<IDB.ReportPeopleCountingSummary> = new Parse.Query(IDB.ReportPeopleCountingSummary);

        let hourSummarys: IDB.ReportPeopleCountingSummary[] = await query
            .containedIn('type', [Enum.ESummaryType.hour, Enum.ESummaryType.day])
            .containedIn('date', [hour, day])
            .find()
            .fail((e) => {
                throw e;
            });

        let summarys: IPushData[] = hourSummarys.reduce<IPushData[]>((prev, curr, index, array) => {
            let summary = prev.find((value, index, array) => {
                return value.areaId === curr.getValue('area').id;
            });
            if (summary) {
                if (curr.getValue('type') === Enum.ESummaryType.day) {
                    summary.inToday += curr.getValue('in');
                    summary.outToday += curr.getValue('out');
                } else {
                    summary.in += curr.getValue('in');
                    summary.out += curr.getValue('out');
                }
            } else {
                if (curr.getValue('type') === Enum.ESummaryType.day) {
                    prev.push({
                        floorId: curr.getValue('floor').id,
                        areaId: curr.getValue('area').id,
                        in: 0,
                        out: 0,
                        inToday: curr.getValue('in'),
                        outToday: curr.getValue('out'),
                    });
                } else {
                    prev.push({
                        floorId: curr.getValue('floor').id,
                        areaId: curr.getValue('area').id,
                        in: curr.getValue('in'),
                        out: curr.getValue('out'),
                        inToday: 0,
                        outToday: 0,
                    });
                }
            }

            return prev;
        }, []);

        return summarys;
    } catch (e) {
        throw e;
    }
}

/**
 * Get date
 * @param type
 * @param date
 */
function GetDate(type: Enum.ESummaryType, date: Date): Date {
    try {
        date = new Date(date);

        switch (type) {
            case Enum.ESummaryType.hour:
                date = new Date(date.setMinutes(0, 0, 0));
                break;
            case Enum.ESummaryType.day:
                date = new Date(date.setHours(0, 0, 0, 0));
                break;
            case Enum.ESummaryType.month:
                date = new Date(new Date(date.setDate(1)).setHours(0, 0, 0, 0));
                break;
        }

        return date;
    } catch (e) {
        throw e;
    }
}

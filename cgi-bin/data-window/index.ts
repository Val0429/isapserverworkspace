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
    total: number;
}

interface IPushCount extends IPushData {
    prevHourAverage: number;
}

interface IPushClient extends IPushData {
    prevHourAverage: number;
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

        let counts: IPushCount[] = [];

        let stop$: Rx.Subject<{}> = new Rx.Subject();

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

        let delay: number = GetDelayTime();
        Rx.Observable.interval(60 * 60 * 1000)
            .startWith(0)
            .delay(delay)
            .takeUntil(stop$)
            .subscribe({
                next: async (x) => {
                    try {
                        counts = await GetPrevHourReport(counts);
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
                },
            });

        push$.subscribe({
            next: async (x) => {
                try {
                    if (!counts.find((n) => n.areaId === x.areaId)) {
                        counts.push({
                            floorId: x.floorId,
                            areaId: x.areaId,
                            total: x.total,
                            prevHourAverage: 0,
                        });
                    } else {
                        counts.find((n) => n.areaId === x.areaId).total = x.total;
                    }

                    send$.next();
                } catch (e) {
                    Print.Log(e, new Error(), 'error');
                }
            },
        });

        _socket.io.on('close', () => {
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

                send$.next();
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        });

        counts = await GetPrevHourReport([]);

        send$.next();
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
function DataFilter(counts: IPushCount[], mode: EPushMode, id: string): IPushClient[] {
    try {
        let _counts: IPushCount[] = counts;

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
 * Get previous hour report
 * @param counts
 */
async function GetPrevHourReport(counts: IPushCount[]): Promise<IPushCount[]> {
    try {
        let date: Date = new Date();
        date = new Date(date.setHours(date.getHours() - 1, 0, 0, 0));

        let prevSummarys: IPushCount[] = await ReportSummary(date);

        if (counts.length === 0) {
            date = new Date();
            date = new Date(date.setHours(date.getHours(), 0, 0, 0));

            let currSummarys: IPushCount[] = await ReportSummary(date);

            counts = prevSummarys.concat(currSummarys);
        } else {
            counts = prevSummarys.concat(counts);
        }

        counts = counts.reduce<IPushCount[]>((prev, curr, index, array) => {
            let summary: IPushCount = prev.find((value1, array1, index1) => {
                return value1.areaId === curr.areaId;
            });

            if (summary) {
                summary.total = curr.prevHourAverage;
            } else {
                if (index >= prevSummarys.length) {
                    prev.push({
                        floorId: curr.floorId,
                        areaId: curr.areaId,
                        total: curr.prevHourAverage,
                        prevHourAverage: 0,
                    });
                } else {
                    prev.push({
                        floorId: curr.floorId,
                        areaId: curr.areaId,
                        total: curr.total,
                        prevHourAverage: curr.prevHourAverage,
                    });
                }
            }

            return prev;
        }, []);

        return counts;
    } catch (e) {
        throw e;
    }
}

/**
 * Report summary
 * @param date
 */
async function ReportSummary(date: Date): Promise<IPushCount[]> {
    try {
        let reportHDSummarys: IDB.ReportHumanDetectionSummary[] = await new Parse.Query(IDB.ReportHumanDetectionSummary)
            .equalTo('type', Enum.ESummaryType.hour)
            .equalTo('date', date)
            .find()
            .fail((e) => {
                throw e;
            });

        let summarys: IPushCount[] = reportHDSummarys.reduce<IPushCount[]>((prev, curr, index, array) => {
            let summary: IPushCount = prev.find((value1, array1, index1) => {
                return value1.areaId === curr.getValue('area').id;
            });

            let average: number = Math.round(curr.getValue('total') / curr.getValue('count') || 0);

            if (summary) {
                summary.prevHourAverage += average;
            } else {
                prev.push({
                    floorId: curr.getValue('floor').id,
                    areaId: curr.getValue('area').id,
                    total: 0,
                    prevHourAverage: average,
                });
            }

            return prev;
        }, []);

        return summarys;
    } catch (e) {
        throw e;
    }
}

/**
 * Get delay time
 */
function GetDelayTime(): number {
    try {
        let now: Date = new Date();
        let target: Date = new Date(new Date(now).setHours(now.getHours() + 1, 0, 0, 0));
        let delay: number = target.getTime() - now.getTime();

        return delay;
    } catch (e) {
        throw e;
    }
}

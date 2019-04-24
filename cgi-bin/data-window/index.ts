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
    count: number;
}

interface IPushCount extends IPushData {
    prevHourTotal: number;
    prevHourCount: number;
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
                            count: x.count,
                            prevHourTotal: 0,
                            prevHourCount: 0,
                        });
                    } else {
                        counts.find((n) => n.areaId === x.areaId).count = x.count;
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
        let _counts: IPushCount[] = [];

        if (mode === EPushMode.floor) {
            _counts = counts.filter((value, index, array) => {
                return value.floorId === id;
            });
        }

        return _counts.map((value, index, array) => {
            let average: number = value.prevHourCount / value.prevHourTotal || 0;

            return {
                floorId: value.floorId,
                areaId: value.areaId,
                count: value.count,
                prevHourAverage: Math.round(average),
            };
        });
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
            if (summary) {
                summary.prevHourTotal += curr.getValue('total');
                summary.prevHourCount += curr.getValue('count');
            } else {
                prev.push({
                    floorId: curr.getValue('floor').id,
                    areaId: curr.getValue('area').id,
                    count: 0,
                    prevHourTotal: curr.getValue('total'),
                    prevHourCount: curr.getValue('count'),
                });
            }

            return prev;
        }, []);

        if (counts.length === 0) {
            counts = summarys.map((value, index, array) => {
                let average: number = value.prevHourCount / value.prevHourTotal || 0;

                return {
                    ...value,
                    count: Math.round(average),
                };
            });
        } else {
            counts = [].concat(summarys).reduce<IPushCount[]>((prev, curr, index, array) => {
                let summary: IPushCount = prev.find((value1, array1, index1) => {
                    return value1.areaId === curr.areaId;
                });
                if (summary) {
                    summary.prevHourTotal += curr.total;
                    summary.prevHourCount += curr.count;
                } else {
                    prev.push({
                        floorId: curr.floorId,
                        areaId: curr.areaId,
                        count: curr.count,
                        prevHourTotal: curr.prevHourTotal,
                        prevHourCount: curr.prevHourCount,
                    });
                }

                return prev;
            }, []);
        }

        return counts;
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

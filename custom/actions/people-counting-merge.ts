import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';

class Action {
    /**
     *
     */
    private _config = Config.devicePeopleCounting;

    /**
     *
     */
    private _action$: Rx.Subject<Action.IAction> = new Rx.Subject();
    public get action$(): Rx.Subject<Action.IAction> {
        return this._action$;
    }

    /**
     *
     */
    private _save$: Rx.Subject<Action.ISave> = new Rx.Subject();

    /**
     *
     */
    constructor() {
        let initialization$: Rx.Subject<{}> = new Rx.Subject();
        let next$: Rx.Subject<{}> = new Rx.Subject();
        initialization$
            .debounceTime(1000)
            .zip(next$.startWith(0))
            .subscribe({
                next: async () => {
                    try {
                        await this.Initialization();
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }

                    next$.next();
                },
            });

        Main.ready$.subscribe({
            next: async () => {
                initialization$.next();
            },
        });
    }

    /**
     * Initialization
     */
    private async Initialization(): Promise<void> {
        try {
            this.EnableSaveStream();
            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Save report summary
     * @param base
     * @param count
     * @param type
     */
    private async SaveReportSummary(base: IDB.IReportBase, count: Action.ICount, type: Enum.ESummaryType): Promise<void> {
        try {
            let currDate: Date = new Date(base.date);
            let prevDate: Date = new Date(base.date);
            switch (type) {
                case Enum.ESummaryType.hour:
                    currDate = new Date(currDate.setMinutes(0, 0, 0));
                    prevDate = new Date(prevDate.setHours(currDate.getHours() - 1, 0, 0, 0));
                    break;
                case Enum.ESummaryType.day:
                    currDate = new Date(currDate.setHours(0, 0, 0, 0));
                    prevDate = new Date(new Date(currDate).setDate(currDate.getDate() - 1));
                    break;
                case Enum.ESummaryType.month:
                    currDate = new Date(new Date(currDate.setDate(1)).setHours(0, 0, 0, 0));
                    prevDate = new Date(new Date(currDate).setMonth(currDate.getMonth() - 1));
                    break;
                case Enum.ESummaryType.season:
                    let season = Math.ceil((currDate.getMonth() + 1) / 3);
                    currDate = new Date(new Date(new Date(currDate.setMonth((season - 1) * 3)).setDate(1)).setHours(0, 0, 0, 0));
                    prevDate = new Date(new Date(currDate).setMonth(currDate.getMonth() - 3));
                    break;
            }

            let query: Parse.Query<IDB.ReportPeopleCountingSummary> = new Parse.Query(IDB.ReportPeopleCountingSummary).equalTo('device', base.device).equalTo('type', type);

            let currSummary: IDB.ReportPeopleCountingSummary = await query
                .equalTo('date', currDate)
                .first()
                .fail((e) => {
                    throw e;
                });
            let prevSummary: IDB.ReportPeopleCountingSummary = await query
                .equalTo('date', prevDate)
                .first()
                .fail((e) => {
                    throw e;
                });

            let prevCount: Action.ICount = {
                in: prevSummary ? prevSummary.getValue('inTotal') : 0,
                out: prevSummary ? prevSummary.getValue('outTotal') : 0,
            };

            if (!currSummary) {
                currSummary = new IDB.ReportPeopleCountingSummary();

                currSummary.setValue('site', base.site);
                currSummary.setValue('area', base.area);
                currSummary.setValue('device', base.device);
                currSummary.setValue('type', type);
                currSummary.setValue('date', currDate);
            }

            currSummary.setValue('in', count.in - prevCount.in);
            currSummary.setValue('out', count.out - prevCount.out);
            currSummary.setValue('inTotal', count.in);
            currSummary.setValue('outTotal', count.out);

            await currSummary.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable save stream
     */
    private EnableSaveStream(): void {
        try {
            let next$: Rx.Subject<{}> = new Rx.Subject();

            this._save$
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        try {
                            let tasks: Promise<any>[] = [];

                            tasks.push(this.SaveReportSummary(x.base, x.count, Enum.ESummaryType.hour));
                            // tasks.push(this.SaveReportSummary(x.base, x.count, Enum.ESummaryType.day));
                            // tasks.push(this.SaveReportSummary(x.base, x.count, Enum.ESummaryType.month));
                            // tasks.push(this.SaveReportSummary(x.base, x.count, Enum.ESummaryType.season));

                            await Promise.all(tasks).catch((e) => {
                                throw e;
                            });
                        } catch (e) {
                            Print.Log(e, new Error(), 'error');
                        }

                        next$.next();
                    },
                });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Enable live stream
     */
    private EnableLiveStream(): void {
        try {
            let next$: Rx.Subject<{}> = new Rx.Subject();

            this._action$
                .buffer(this._action$.bufferCount(this._config.bufferCount).merge(Rx.Observable.interval(1000)))
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        try {
                            await Promise.all(
                                x.map(async (value, index, array) => {
                                    try {
                                        let site: IDB.LocationSite = value.device.getValue('site');
                                        let area: IDB.LocationArea = value.device.getValue('area');
                                        let groups: IDB.DeviceGroup[] = value.device.getValue('groups');
                                        let device: IDB.Device = value.device;

                                        let base: IDB.IReportBase = {
                                            site: site,
                                            area: area,
                                            device: device,
                                            date: value.date,
                                        };

                                        let count: Action.ICount = {
                                            in: value.in,
                                            out: value.out,
                                        };

                                        this._save$.next({ base: base, count: count });
                                    } catch (e) {
                                        Print.Log(e, new Error(), 'error');
                                    }
                                }),
                            );
                        } catch (e) {
                            Print.Log(e, new Error(), 'error');
                        }

                        next$.next();
                    },
                });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }
}
export default new Action();

namespace Action {
    /**
     *
     */
    export interface IAction {
        device: IDB.Device;
        date: Date;
        in: number;
        out: number;
    }

    /**
     *
     */
    export interface ICount {
        in: number;
        out: number;
    }

    /**
     *
     */
    export interface ISave {
        base: IDB.IReportBase;
        count: Action.ICount;
    }
}

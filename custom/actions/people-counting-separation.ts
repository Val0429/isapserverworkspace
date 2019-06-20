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
            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Save report summary
     * @param base
     * @param type
     */
    private async SaveReportSummary(base: IDB.IReportBase, type: Enum.ESummaryType): Promise<void> {
        try {
            let date: Date = new Date(base.date);
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
                case Enum.ESummaryType.season:
                    let season = Math.ceil((date.getMonth() + 1) / 3);
                    date = new Date(new Date(new Date(date.setMonth((season - 1) * 3)).setDate(1)).setHours(0, 0, 0, 0));
                    break;
            }

            let reportSummary: IDB.ReportPeopleCountingSummary = await new Parse.Query(IDB.ReportPeopleCountingSummary)
                .equalTo('device', base.device)
                .equalTo('type', type)
                .equalTo('date', date)
                .first()
                .fail((e) => {
                    throw e;
                });

            let isIn = base.device.getValue('direction') === Enum.EDeviceDirection.in;

            if (reportSummary) {
                reportSummary.setValue('in', reportSummary.getValue('in') + (isIn ? 1 : 0));
                reportSummary.setValue('out', reportSummary.getValue('out') + (isIn ? 0 : 1));
            } else {
                reportSummary = new IDB.ReportPeopleCountingSummary();

                reportSummary.setValue('site', base.site);
                reportSummary.setValue('area', base.area);
                reportSummary.setValue('device', base.device);
                reportSummary.setValue('type', type);
                reportSummary.setValue('date', date);
                reportSummary.setValue('in', isIn ? 1 : 0);
                reportSummary.setValue('inTotal', 0);
                reportSummary.setValue('out', isIn ? 0 : 1);
                reportSummary.setValue('outTotal', 0);
            }

            await reportSummary.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
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

                                        let tasks: Promise<any>[] = [];

                                        tasks.push(this.SaveReportSummary(base, Enum.ESummaryType.hour));
                                        tasks.push(this.SaveReportSummary(base, Enum.ESummaryType.day));
                                        tasks.push(this.SaveReportSummary(base, Enum.ESummaryType.month));
                                        tasks.push(this.SaveReportSummary(base, Enum.ESummaryType.season));

                                        await Promise.all(tasks).catch((e) => {
                                            throw e;
                                        });
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
    }
}

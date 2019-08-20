import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, DateTime } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';

class Action {
    /**
     *
     */
    private _initialization$: Rx.Subject<{}> = new Rx.Subject();

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
        let next$: Rx.Subject<{}> = new Rx.Subject();
        this._initialization$
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
                this._initialization$.next();
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
     * @param count
     * @param type
     */
    private async SaveReportSummary(base: IDB.IReportBase, count: Action.ICount, type: Enum.ESummaryType): Promise<void> {
        try {
            let currDate: Date = DateTime.Type2Date(base.date, type);
            let prevDate: Date = DateTime.Type2Date(base.date, type, -1);

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
     * Enable live stream
     */
    private EnableLiveStream(): void {
        try {
            let next$: Rx.Subject<{}> = new Rx.Subject();
            this._action$
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
}
export default new Action();

namespace Action {
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
    export interface IAction {
        base: IDB.IReportBase;
        count: Action.ICount;
    }
}

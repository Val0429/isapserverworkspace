import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Draw, Utility, DateTime, File } from '../helpers';
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
    private _config = Config.devicePeopleCounting;

    /**
     *
     */
    private _imageConfig = this._config.output.image;

    /**
     *
     */
    private _imageSize: Draw.ISize = {
        width: this._imageConfig.width,
        height: this._imageConfig.height,
    };

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
     * @param groups
     * @param type
     */
    private async SaveReportSummary(base: IDB.IReportBase, isEmployee: boolean, type: Enum.ESummaryType): Promise<void> {
        try {
            let date: Date = DateTime.Type2Date(base.date, type);

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

                if (isEmployee) {
                    reportSummary.setValue('inEmployee', (reportSummary.getValue('inEmployee') || 0) + (isIn ? 1 : 0));
                    reportSummary.setValue('outEmployee', (reportSummary.getValue('outEmployee') || 0) + (isIn ? 1 : 0));
                }
            } else {
                reportSummary = new IDB.ReportPeopleCountingSummary();

                reportSummary.setValue('site', base.site);
                reportSummary.setValue('area', base.area);
                reportSummary.setValue('device', base.device);
                reportSummary.setValue('type', type);
                reportSummary.setValue('date', date);
                reportSummary.setValue('in', isIn ? 1 : 0);
                reportSummary.setValue('inEmployee', 0);
                reportSummary.setValue('inTotal', 0);
                reportSummary.setValue('out', isIn ? 0 : 1);
                reportSummary.setValue('outEmployee', 0);
                reportSummary.setValue('outTotal', 0);

                if (isEmployee) {
                    reportSummary.setValue('inEmployee', isIn ? 1 : 0);
                    reportSummary.setValue('outEmployee', isIn ? 1 : 0);
                }
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
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        let buffer: Buffer = x.buffer;

                        try {
                            buffer = await Draw.Resize(buffer, this._imageSize, this._imageConfig.isFill, this._imageConfig.isTransparent);

                            let imageSrc: string = `images_report/people_counting/${DateTime.ToString(x.base.date, 'YYYYMMDD')}/${Utility.RandomText(10, { symbol: false })}_${new Date().getTime()}.${this._imageConfig.isTransparent ? 'png' : 'jpeg'}`;
                            File.WriteFile(`${File.assetsPath}/${imageSrc}`, buffer);

                            let tasks: Promise<any>[] = [];

                            tasks.push(this.SaveReportSummary(x.base, x.isEmployee, Enum.ESummaryType.hour));
                            // tasks.push(this.SaveReportSummary(x.base, x.isEmployee, Enum.ESummaryType.day));
                            // tasks.push(this.SaveReportSummary(x.base, x.isEmployee, Enum.ESummaryType.month));
                            // tasks.push(this.SaveReportSummary(x.base, x.isEmployee, Enum.ESummaryType.season));

                            await Promise.all(tasks).catch((e) => {
                                throw e;
                            });
                        } catch (e) {
                            Print.Log(e, new Error(), 'error');
                        } finally {
                            buffer = null;
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
        base: IDB.IReportBase;
        buffer: Buffer;
        isEmployee: boolean;
    }
}

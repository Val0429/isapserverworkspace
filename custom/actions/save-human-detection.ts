import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Draw, DateTime, File, HumanDetection } from '../helpers';
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
    private _config = Config.deviceHumanDetection;

    /**
     *
     */
    private _rectangle = this._config.output.rectangle;

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
     * @param report
     * @param type
     */
    private async SaveReportSummary(report: IDB.ReportHumanDetection, type: Enum.ESummaryType): Promise<void> {
        try {
            let date: Date = DateTime.Type2Date(report.getValue('date'), type);

            let reportSummary: IDB.ReportHumanDetectionSummary = await new Parse.Query(IDB.ReportHumanDetectionSummary)
                .equalTo('device', report.getValue('device'))
                .equalTo('type', type)
                .equalTo('date', date)
                .include(['min', 'max'])
                .first()
                .fail((e) => {
                    throw e;
                });

            if (reportSummary) {
                let total: number = reportSummary.getValue('total') + report.getValue('value');
                let count: number = reportSummary.getValue('count') + 1;

                reportSummary.setValue('total', total);
                reportSummary.setValue('count', count);

                if (report.getValue('value') > reportSummary.getValue('max').getValue('value')) {
                    reportSummary.setValue('max', report);
                }
                if (report.getValue('value') < reportSummary.getValue('min').getValue('value')) {
                    reportSummary.setValue('min', report);
                }
            } else {
                reportSummary = new IDB.ReportHumanDetectionSummary();

                reportSummary.setValue('site', report.getValue('site'));
                reportSummary.setValue('area', report.getValue('area'));
                reportSummary.setValue('device', report.getValue('device'));
                reportSummary.setValue('type', type);
                reportSummary.setValue('date', date);
                reportSummary.setValue('total', report.getValue('value'));
                reportSummary.setValue('count', 1);
                reportSummary.setValue('max', report);
                reportSummary.setValue('min', report);
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
                            if (x.locations.length > 0) {
                                let rects: Draw.IRect[] = x.locations.map((value, index, array) => {
                                    return {
                                        x: value.x,
                                        y: value.y,
                                        width: value.width,
                                        height: value.height,
                                        color: this._rectangle.color,
                                        lineWidth: this._rectangle.lineWidth,
                                        isFill: this._rectangle.isFill,
                                    };
                                });

                                buffer = await Draw.Rectangle(rects, buffer);
                            }

                            buffer = await Draw.Resize(buffer, this._imageSize, this._imageConfig.isFill, this._imageConfig.isTransparent);

                            let report: IDB.ReportHumanDetection = new IDB.ReportHumanDetection();

                            report.setValue('site', x.base.site);
                            report.setValue('area', x.base.area);
                            report.setValue('device', x.base.device);
                            report.setValue('date', x.base.date);
                            report.setValue('imageSrc', '');
                            report.setValue('value', x.locations.length);

                            await report.save(null, { useMasterKey: true }).fail((e) => {
                                throw e;
                            });

                            let imageSrc: string = `images_report/human_detection/${DateTime.ToString(report.createdAt, 'YYYYMMDD')}/${report.id}_report_${report.createdAt.getTime()}.${this._imageConfig.isTransparent ? 'png' : 'jpeg'}`;
                            File.WriteFile(`${File.assetsPath}/${imageSrc}`, buffer);

                            report.setValue('imageSrc', imageSrc);

                            let tasks: Promise<any>[] = [];

                            tasks.push(report.save(null, { useMasterKey: true }) as any);
                            tasks.push(this.SaveReportSummary(report, Enum.ESummaryType.hour));
                            // tasks.push(this.SaveReportSummary(report, Enum.ESummaryType.day));
                            // tasks.push(this.SaveReportSummary(report, Enum.ESummaryType.month));
                            // tasks.push(this.SaveReportSummary(report, Enum.ESummaryType.season));

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
        locations: HumanDetection.ILocation[];
    }
}

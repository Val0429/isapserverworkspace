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
    private _config = Config.deviceHeatmap;

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
     * Heatmap score
     * @param size
     * @param locations
     * @param scores
     * @param scoreSize
     */
    private HeatmapScore(size: Draw.ISize, locations: HumanDetection.ILocation[]): number[][];
    private HeatmapScore(size: Draw.ISize, locations: HumanDetection.ILocation[], scores: number[][], scoreSize: Draw.ISize): number[][];
    private HeatmapScore(size: Draw.ISize, locations: HumanDetection.ILocation[], scores?: number[][], scoreSize?: Draw.ISize): number[][] {
        try {
            let width: number = size.width;
            let height: number = size.height;

            if (scoreSize && (scoreSize.width !== width || scoreSize.height !== height)) {
                return scores;
            }

            let gridUnit: number = this._config.gridUnit;

            let widthGrid: number = Math.ceil(width / gridUnit);
            let heightGrid: number = Math.ceil(height / gridUnit);

            if (!scores) {
                scores = new Array(heightGrid).fill([]).map((value, index, array) => {
                    return new Array(widthGrid).fill(0);
                });
            }

            locations.forEach((value, index, array) => {
                let x1Grid = Math.floor(value.x / gridUnit);
                let y1Grid = Math.floor(value.y / gridUnit);
                let x2Grid = Math.ceil((value.x + value.width) / gridUnit);
                let y2Grid = Math.ceil((value.y + value.height) / gridUnit);

                for (let i: number = y1Grid; i < y2Grid; i++) {
                    for (let j: number = x1Grid; j < x2Grid; j++) {
                        scores[i][j] += 1;
                    }
                }
            });

            return scores;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Save report summary
     * @param report
     * @param size
     * @param type
     */
    private async SaveReportSummary(report: IDB.ReportHeatmap, size: Draw.ISize, type: Enum.ESummaryType): Promise<void> {
        try {
            let date: Date = DateTime.Type2Date(report.getValue('date'), type);

            let reportSummary: IDB.ReportHeatmapSummary = await new Parse.Query(IDB.ReportHeatmapSummary)
                .equalTo('device', report.getValue('device'))
                .equalTo('type', type)
                .equalTo('date', date)
                .first()
                .fail((e) => {
                    throw e;
                });

            if (reportSummary) {
                let scoreSize: Draw.ISize = {
                    width: reportSummary.getValue('width'),
                    height: reportSummary.getValue('height'),
                };
                let scores = this.HeatmapScore(size, report.getValue('results'), reportSummary.getValue('scores'), scoreSize);

                reportSummary.setValue('scores', scores);
            } else {
                let scores = this.HeatmapScore(size, report.getValue('results'));

                reportSummary = new IDB.ReportHeatmapSummary();

                reportSummary.setValue('site', report.getValue('site'));
                reportSummary.setValue('area', report.getValue('area'));
                reportSummary.setValue('device', report.getValue('device'));
                reportSummary.setValue('type', type);
                reportSummary.setValue('date', date);
                reportSummary.setValue('imageSrc', report.getValue('imageSrc'));
                reportSummary.setValue('width', size.width);
                reportSummary.setValue('height', size.height);
                reportSummary.setValue('scores', scores);
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
                            let imageSize: Draw.ISize = await Draw.ImageSize(buffer);

                            let report: IDB.ReportHeatmap = new IDB.ReportHeatmap();

                            report.setValue('site', x.base.site);
                            report.setValue('area', x.base.area);
                            report.setValue('device', x.base.device);
                            report.setValue('date', x.base.date);
                            report.setValue('imageSrc', '');
                            report.setValue('results', x.locations);

                            await report.save(null, { useMasterKey: true }).fail((e) => {
                                throw e;
                            });

                            if (this._config.output.saveSource) {
                                File.WriteFile(`${File.assetsPath}/images_report_source/heatmap/${DateTime.ToString(report.createdAt, 'YYYYMMDD')}/${report.id}_report_${report.createdAt.getTime()}.bmp`, buffer);
                            }

                            buffer = await Draw.Resize(buffer, this._imageSize, this._imageConfig.isFill, this._imageConfig.isTransparent);

                            let imageSrc: string = `images_report/heatmap/${DateTime.ToString(report.createdAt, 'YYYYMMDD')}/${report.id}_report_${report.createdAt.getTime()}.${this._imageConfig.isTransparent ? 'png' : 'jpeg'}`;
                            File.WriteFile(`${File.assetsPath}/${imageSrc}`, buffer);

                            report.setValue('imageSrc', imageSrc);

                            let tasks: Promise<any>[] = [];

                            tasks.push(report.save(null, { useMasterKey: true }) as any);
                            tasks.push(this.SaveReportSummary(report, imageSize, Enum.ESummaryType.hour));
                            // tasks.push(this.SaveReportSummary(report, imageSize, Enum.ESummaryType.day));
                            // tasks.push(this.SaveReportSummary(report, imageSize, Enum.ESummaryType.month));
                            // tasks.push(this.SaveReportSummary(report, imageSize, Enum.ESummaryType.season));

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
    export interface IAction {
        base: IDB.IReportBase;
        buffer: Buffer;
        locations: HumanDetection.ILocation[];
    }
}

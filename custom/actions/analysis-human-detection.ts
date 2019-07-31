import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Draw, File, HumanDetection, DateTime } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';
import { DeleteFile } from './';

class Action {
    /**
     *
     */
    private _initialization$: Rx.Subject<{}> = new Rx.Subject();

    /**
     *
     */
    private _hdConfig = Config.deviceHumanDetection;

    /**
     *
     */
    private _hmConfig = Config.deviceHeatmap;

    /**
     *
     */
    private _hds: Action.IHD[] = [];
    public get hds(): Action.IHD[] {
        return this._hds;
    }

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
    private _saveHD$: Rx.Subject<Action.ISaveHD> = new Rx.Subject();

    /**
     *
     */
    private _saveHM$: Rx.Subject<Action.ISaveHM> = new Rx.Subject();

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

        IDB.ServerHumanDetection.notice$.subscribe({
            next: (x) => {
                if (x.crud === 'c' || x.crud === 'u' || x.crud === 'd') {
                    this._initialization$.next();
                }
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
            this.Stop();

            await this.Search();

            this.EnableSaveStream();
            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Stop
     */
    private Stop(): void {
        try {
            this._action$.complete();
            this._action$ = new Rx.Subject();

            this._saveHD$.complete();
            this._saveHD$ = new Rx.Subject();

            this._saveHM$.complete();
            this._saveHM$ = new Rx.Subject();
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search
     */
    private async Search(): Promise<void> {
        try {
            let servers: IDB.ServerHumanDetection[] = await new Parse.Query(IDB.ServerHumanDetection).find().fail((e) => {
                throw e;
            });

            this._hds = servers.map((value, index, array) => {
                Print.Log(`${value.id}(server)->${value.getValue('name')}`, new Error(), 'info');

                let hd: HumanDetection.ISap = new HumanDetection.ISap();
                hd.config = {
                    protocol: value.getValue('protocol'),
                    ip: value.getValue('ip'),
                    port: value.getValue('port'),
                };
                hd.score = value.getValue('target_score');

                hd.Initialization();

                return {
                    objectId: value.id,
                    name: value.getValue('name'),
                    hd: hd,
                };
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Save report summary
     * @param report
     * @param type
     */
    private async SaveHDReportSummary(report: IDB.ReportHumanDetection, type: Enum.ESummaryType): Promise<void> {
        try {
            let date: Date = this.GetTypeDate(report.getValue('date'), type);

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
     * Save report summary
     * @param report
     * @param size
     * @param type
     */
    private async SaveHMReportSummary(report: IDB.ReportHeatmap, size: Draw.ISize, type: Enum.ESummaryType): Promise<void> {
        try {
            let date: Date = this.GetTypeDate(report.getValue('date'), type);

            let reportSummary: IDB.ReportHeatmapSummary = await new Parse.Query(IDB.ReportHeatmapSummary)
                .equalTo('device', report.getValue('device'))
                .equalTo('type', type)
                .equalTo('date', date)
                .first()
                .fail((e) => {
                    throw e;
                });

            if (reportSummary) {
                let hmConfig = this._hmConfig;
                let gridUnit: number = hmConfig.gridUnit;

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
     * Get type date
     * @param date
     * @param type
     */
    private GetTypeDate(date: Date, type: Enum.ESummaryType): Date {
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
                case Enum.ESummaryType.season:
                    let season = Math.ceil((date.getMonth() + 1) / 3);
                    date = new Date(new Date(new Date(date.setMonth((season - 1) * 3)).setDate(1)).setHours(0, 0, 0, 0));
                    break;
            }

            return date;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Location filter
     * @param rois
     * @param locations
     */
    private LocationFilter(rois: Draw.ILocation[], locations: HumanDetection.ILocation[]): HumanDetection.ILocation[] {
        try {
            if (!rois || rois.length === 0) {
                return locations;
            }

            locations = locations.filter((value, index, array) => {
                let centerX: number = value.x + value.width / 2;
                let centerY: number = value.y + value.height / 2;

                let roi = rois.find((value1, index1, array1) => {
                    return centerX >= value1.x && centerX <= value1.x + value1.width && centerY >= value1.y && centerY <= value1.y + value1.height;
                });

                return roi;
            });

            return locations;
        } catch (e) {
            throw e;
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

            let hmConfig = this._hmConfig;
            let gridUnit: number = hmConfig.gridUnit;

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
     * Enable save stream
     */
    private EnableSaveStream(): void {
        try {
            let nextHD$: Rx.Subject<{}> = new Rx.Subject();

            this._saveHD$
                .zip(nextHD$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        try {
                            let tasks: Promise<any>[] = [];

                            tasks.push(x.report.save(null, { useMasterKey: true }) as any);
                            tasks.push(this.SaveHDReportSummary(x.report, Enum.ESummaryType.hour));

                            await Promise.all(tasks).catch((e) => {
                                throw e;
                            });
                        } catch (e) {
                            Print.Log(e, new Error(), 'error');
                        }

                        nextHD$.next();
                    },
                });

            let nextHM$: Rx.Subject<{}> = new Rx.Subject();

            this._saveHM$
                .zip(nextHM$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        try {
                            let tasks: Promise<any>[] = [];

                            tasks.push(x.report.save(null, { useMasterKey: true }) as any);
                            tasks.push(this.SaveHMReportSummary(x.report, x.size, Enum.ESummaryType.hour));

                            await Promise.all(tasks).catch((e) => {
                                throw e;
                            });
                        } catch (e) {
                            Print.Log(e, new Error(), 'error');
                        }

                        nextHM$.next();
                    },
                });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * HumanDetection
     * @param device
     * @param date
     * @param buffer
     * @param locations
     */
    public async HumanDetection(device: IDB.Device, date: Date, buffer: Buffer, locations: HumanDetection.ILocation[]): Promise<void> {
        try {
            let site: IDB.LocationSite = device.getValue('site');
            let area: IDB.LocationArea = device.getValue('area');
            let groups: IDB.DeviceGroup[] = device.getValue('groups');

            let hdConfig = this._hdConfig;

            let rectangle = hdConfig.output.rectangle;
            let image = hdConfig.output.image;
            let size: Draw.ISize = {
                width: image.width,
                height: image.height,
            };

            if (locations.length > 0) {
                let rects: Draw.IRect[] = locations.map((value, index, array) => {
                    return {
                        x: value.x,
                        y: value.y,
                        width: value.width,
                        height: value.height,
                        color: rectangle.color,
                        lineWidth: rectangle.lineWidth,
                        isFill: rectangle.isFill,
                    };
                });

                buffer = await Draw.Rectangle(rects, buffer);
            }

            buffer = await Draw.Resize(buffer, size, image.isFill, image.isTransparent);

            let report: IDB.ReportHumanDetection = new IDB.ReportHumanDetection();

            report.setValue('site', site);
            report.setValue('area', area);
            report.setValue('device', device);
            report.setValue('date', date);
            report.setValue('imageSrc', '');
            report.setValue('value', locations.length);

            await report.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            let imageSrc: string = `images_report/human_detection/${DateTime.ToString(report.createdAt, 'YYYYMMDD')}/${report.id}_report_${report.createdAt.getTime()}.${image.isTransparent ? 'png' : 'jpeg'}`;
            File.WriteFile(`${File.assetsPath}/${imageSrc}`, buffer);

            report.setValue('imageSrc', imageSrc);

            this._saveHD$.next({ report: report });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Heatmap
     * @param device
     * @param date
     * @param buffer
     * @param locations
     */
    public async Heatmap(device: IDB.Device, date: Date, buffer: Buffer, locations: HumanDetection.ILocation[]): Promise<void> {
        try {
            let site: IDB.LocationSite = device.getValue('site');
            let area: IDB.LocationArea = device.getValue('area');
            let groups: IDB.DeviceGroup[] = device.getValue('groups');

            let hmConfig = this._hmConfig;

            let image = hmConfig.output.image;
            let size: Draw.ISize = {
                width: image.width,
                height: image.height,
            };

            let imageSize: Draw.ISize = await Draw.ImageSize(buffer);
            buffer = await Draw.Resize(buffer, size, image.isFill, image.isTransparent);

            let report: IDB.ReportHeatmap = new IDB.ReportHeatmap();

            report.setValue('site', site);
            report.setValue('area', area);
            report.setValue('device', device);
            report.setValue('date', date);
            report.setValue('imageSrc', '');
            report.setValue('results', locations);

            await report.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            let imageSrc: string = `images_report/heatmap/${DateTime.ToString(report.createdAt, 'YYYYMMDD')}/${report.id}_report_${report.createdAt.getTime()}.${image.isTransparent ? 'png' : 'jpeg'}`;
            File.WriteFile(`${File.assetsPath}/${imageSrc}`, buffer);

            report.setValue('imageSrc', imageSrc);

            this._saveHM$.next({ report: report, size: imageSize });
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
                .buffer(this._action$.bufferCount(this._hdConfig.bufferCount).merge(Rx.Observable.interval(1000)))
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        try {
                            await Promise.all(
                                x.map(async (value, index, array) => {
                                    let buffer: Buffer = null;

                                    try {
                                        let device: IDB.Device = value.device;
                                        let rois: Draw.ILocation[] = device.getValue('rois');

                                        let hdServer: Action.IHD = this._hds.find((value1, index1, array1) => {
                                            return value1.objectId === device.getValue('hdServer').id;
                                        });
                                        if (!hdServer) {
                                            throw `${device.id}(device) -> human detection server not found`;
                                        }

                                        buffer = File.ReadFile(value.image);

                                        let locations = await hdServer.hd.GetAnalysis(buffer);

                                        locations = this.LocationFilter(rois, locations);

                                        if (value.type === Enum.EDeviceMode.humanDetection) {
                                            await this.HumanDetection(device, value.date, buffer, locations);
                                        } else if (value.type === Enum.EDeviceMode.heatmap) {
                                            await this.Heatmap(device, value.date, buffer, locations);
                                        }
                                    } catch (e) {
                                        Print.Log(e, new Error(), 'error');
                                    } finally {
                                        DeleteFile.action$.next(value.image);
                                        buffer = null;
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
    export interface IHD {
        objectId: string;
        name: string;
        hd: HumanDetection.ISap;
    }

    /**
     *
     */
    export interface IAction {
        type: Enum.EDeviceMode.humanDetection | Enum.EDeviceMode.heatmap;
        device: IDB.Device;
        date: Date;
        image: string;
    }

    /**
     *
     */
    export interface ISaveHD {
        report: IDB.ReportHumanDetection;
    }

    /**
     *
     */
    export interface ISaveHM {
        report: IDB.ReportHeatmap;
        size: Draw.ISize;
    }
}
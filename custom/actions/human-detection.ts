import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Draw, File, HumanDetection } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';

class Action {
    /**
     *
     */
    private _config = Config.deviceHumanDetection;

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

        IDB.ServerHumanDetection.notice$.subscribe({
            next: (x) => {
                if (x.crud === 'c' || x.crud === 'u' || x.crud === 'd') {
                    initialization$.next();
                }
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
            await this.Search();

            this.EnableSaveStream();
            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
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
    private async SaveReportSummary(report: IDB.ReportHumanDetection, type: Enum.ESummaryType): Promise<void> {
        try {
            let date: Date = new Date(report.getValue('date'));
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

                            tasks.push(x.report.save(null, { useMasterKey: true }) as any);
                            tasks.push(this.SaveReportSummary(x.report, Enum.ESummaryType.hour));
                            // tasks.push(this.SaveReportSummary(x.report, Enum.ESummaryType.day));
                            // tasks.push(this.SaveReportSummary(x.report, Enum.ESummaryType.month));
                            // tasks.push(this.SaveReportSummary(x.report, Enum.ESummaryType.season));

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
                                        let rois: Draw.ILocation[] = device.getValue('rois');

                                        let hdConfig = this._config;
                                        let hd: Action.IHD = this._hds.find((value1, index1, array1) => {
                                            return value1.objectId === device.getValue('hdServer').id;
                                        });
                                        if (!hd) {
                                            throw `${device.id}(device) -> human detection server not found`;
                                        }

                                        let rectangle = hdConfig.output.rectangle;
                                        let image = hdConfig.output.image;
                                        let size: Draw.ISize = {
                                            width: image.width,
                                            height: image.height,
                                        };

                                        let rects: Draw.IRect[] = [];

                                        if (hdConfig.roiTest) {
                                            rois.forEach((value, index, array) => {
                                                rects.push({
                                                    x: value.x,
                                                    y: value.y,
                                                    width: value.width,
                                                    height: value.height,
                                                    color: 'green',
                                                    lineWidth: 10,
                                                    isFill: false,
                                                });
                                            });
                                        }

                                        let locations = await hd.hd.GetAnalysis(value.image);

                                        if (hdConfig.roiTest && locations.length > 0) {
                                            locations.forEach((value, index, array) => {
                                                rects.push({
                                                    x: value.x,
                                                    y: value.y,
                                                    width: value.width,
                                                    height: value.height,
                                                    color: 'black',
                                                    lineWidth: rectangle.lineWidth,
                                                    isFill: rectangle.isFill,
                                                });
                                            });
                                        }

                                        locations = this.LocationFilter(rois, locations);

                                        if (locations.length > 0) {
                                            locations.forEach((value, index, array) => {
                                                rects.push({
                                                    x: value.x,
                                                    y: value.y,
                                                    width: value.width,
                                                    height: value.height,
                                                    color: rectangle.color,
                                                    lineWidth: rectangle.lineWidth,
                                                    isFill: rectangle.isFill,
                                                });
                                            });
                                        }

                                        if (hdConfig.roiTest) {
                                            let buffer: Buffer = await Draw.Rectangle(rects, value.image);
                                            buffer = await Draw.Resize(buffer, size, image.isFill, image.isTransparent);

                                            File.WriteFile(`/test/${device.id}_${new Date().getTime()}.${image.isTransparent ? 'png' : 'jpeg'}`, buffer);

                                            rects.splice(0, rects.length - locations.length);
                                        }

                                        value.image = await Draw.Rectangle(rects, value.image);

                                        value.image = await Draw.Resize(value.image, size, image.isFill, image.isTransparent);

                                        let report: IDB.ReportHumanDetection = new IDB.ReportHumanDetection();

                                        report.setValue('site', site);
                                        report.setValue('area', area);
                                        report.setValue('device', device);
                                        report.setValue('date', value.date);
                                        report.setValue('imageSrc', '');
                                        report.setValue('value', locations.length);
                                        report.setValue('results', locations);

                                        await report.save(null, { useMasterKey: true }).fail((e) => {
                                            throw e;
                                        });

                                        let imageSrc: string = `human_detection/${report.id}_report_${report.createdAt.getTime()}.${image.isTransparent ? 'png' : 'jpeg'}`;
                                        File.WriteFile(`${File.assetsPath}/${imageSrc}`, value.image);

                                        report.setValue('imageSrc', imageSrc);

                                        this._save$.next({ report: report });
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
    export interface IHD {
        objectId: string;
        name: string;
        hd: HumanDetection.ISap;
    }

    /**
     *
     */
    export interface IAction {
        device: IDB.Device;
        date: Date;
        image: Buffer;
    }

    /**
     *
     */
    export interface ISave {
        report: IDB.ReportHumanDetection;
    }
}

import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, CMSService, HumanDetection, File, Draw } from '../helpers';
import * as Enum from '../enums';
import * as Action from '../actions';
import * as DataWindow from '../../cgi-bin/data-window';

class Service {
    private _cms: CMSService = undefined;

    private _hd: HumanDetection.ISap = undefined;

    private _liveStreamGroups: Service.ILiveStreamGroup[] = [];

    private _devices: IDB.LocationDevice[] = undefined;
    public get devices(): IDB.LocationDevice[] {
        return this._devices;
    }

    constructor() {
        setTimeout(async () => {
            await this.Initialization();
        }, 0);
    }

    private Initialization = async (): Promise<void> => {
        try {
            await this.Search();

            this.EnableLiveStreamGroup();
            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    };

    private Search = async (): Promise<void> => {
        try {
            this._devices = await new Parse.Query(IDB.LocationDevice)
                .equalTo('isDeleted', false)
                .include(['floor', 'area', 'camera'])
                .find()
                .fail((e) => {
                    throw e;
                });
        } catch (e) {
            throw e;
        }
    };

    private GetDelayTime = (): number => {
        try {
            let now: Date = new Date();
            let target: Date = new Date(new Date(new Date(now).setMinutes(Math.ceil((now.getMinutes() + 1) / 5) * 5)).setSeconds(0, 0));
            let delay: number = target.getTime() - now.getTime();

            return delay;
        } catch (e) {
            throw e;
        }
    };

    private SaveReportSummary = async (reportHD: IDB.ReportHumanDetection, type: Enum.ESummaryType): Promise<void> => {
        try {
            let date: Date = new Date(reportHD.getValue('date'));
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
                // case Enum.ESummaryType.session:
                //     date = new Date(new Date(date.setMonth(Math.ceil((date.getMonth() + 1) / 3), 1)).setHours(0, 0, 0, 0));
                //     break;
            }

            let reportHDSummary: IDB.ReportHumanDetectionSummary = await new Parse.Query(IDB.ReportHumanDetectionSummary)
                .equalTo('device', reportHD.getValue('device'))
                .equalTo('type', type)
                .equalTo('date', date)
                .include(['min', 'max'])
                .first()
                .fail((e) => {
                    throw e;
                });

            if (reportHDSummary) {
                let total: number = reportHDSummary.getValue('total') + reportHD.getValue('total');
                let count: number = reportHDSummary.getValue('count') + 1;

                reportHDSummary.setValue('total', total);
                reportHDSummary.setValue('count', count);

                if (reportHD.getValue('total') > reportHDSummary.getValue('max').getValue('total')) {
                    reportHDSummary.setValue('max', reportHD);
                }
                if (reportHD.getValue('total') < reportHDSummary.getValue('min').getValue('total')) {
                    reportHDSummary.setValue('min', reportHD);
                }

                await reportHDSummary.save(null, { useMasterKey: true }).fail((e) => {
                    throw e;
                });
            } else {
                reportHDSummary = new IDB.ReportHumanDetectionSummary();

                reportHDSummary.setValue('floor', reportHD.getValue('floor'));
                reportHDSummary.setValue('area', reportHD.getValue('area'));
                reportHDSummary.setValue('device', reportHD.getValue('device'));
                reportHDSummary.setValue('type', type);
                reportHDSummary.setValue('date', date);
                reportHDSummary.setValue('total', reportHD.getValue('total'));
                reportHDSummary.setValue('count', 1);
                reportHDSummary.setValue('max', reportHD);
                reportHDSummary.setValue('min', reportHD);
            }

            await reportHDSummary.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    };

    private EnableLiveStreamGroup = (): void => {
        try {
            let areaIds: string[] = this._devices.map((value, index, array) => {
                return value.getValue('area').id;
            });

            let areas: IDB.LocationArea[] = this._devices
                .filter((value, index, array) => {
                    return areaIds.indexOf(value.getValue('area').id) === index;
                })
                .map((value, index, array) => {
                    return value.getValue('area');
                });

            this._liveStreamGroups = areas.map((value, index, array) => {
                let groupDatas: Service.ILiveStreamGroupData[] = [];

                let liveStreamGroup$: Rx.Subject<Service.ILiveStreamGroupData> = new Rx.Subject();
                liveStreamGroup$
                    .map((x) => {
                        return {
                            areaName: value.getValue('name'),
                            action: value.getValue('action'),
                            ...x,
                        };
                    })
                    .subscribe({
                        next: (x) => {
                            try {
                                // console.log();
                                // Print.Log(`${x.areaName}, ${JSON.stringify(x)}`, new Error(), 'message');

                                let prev: number = groupDatas.reduce((prev, curr, index, array) => {
                                    return prev + curr.count;
                                }, 0);

                                if (!groupDatas.find((n) => n.deviceId === x.deviceId)) {
                                    groupDatas.push({
                                        floorId: x.floorId,
                                        areaId: x.areaId,
                                        deviceId: x.deviceId,
                                        count: x.count,
                                    });
                                } else {
                                    groupDatas.find((n) => n.deviceId === x.deviceId).count = x.count;
                                }

                                let curr: number = groupDatas.reduce((prev, curr, index, array) => {
                                    return prev + curr.count;
                                }, 0);

                                // Print.Log(`${x.areaName}, Prev: ${prev}, Curr: ${curr}, ${JSON.stringify(groupDatas)}`, new Error(), 'message');

                                DataWindow.push$.next({
                                    floorId: x.floorId,
                                    areaId: x.areaId,
                                    count: curr,
                                });

                                Action.Smtp.action$.next({
                                    areaName: x.areaName,
                                    rules: x.action.smtp,
                                    prev: prev,
                                    curr: curr,
                                });

                                Action.Sgsms.action$.next({
                                    areaName: x.areaName,
                                    rules: x.action.sgsms,
                                    prev: prev,
                                    curr: curr,
                                });
                            } catch (e) {
                                Print.Log(e, new Error(), 'error');
                            }
                        },
                    });

                return {
                    areaId: value.id,
                    area: value,
                    liveStreamGroup$: liveStreamGroup$,
                };
            });
        } catch (e) {
            throw e;
        }
    };

    private EnableLiveStream = (): void => {
        try {
            let cmsConfig = Config.cms;
            let hdConfig = Config.humanDetection;

            this._hd = new HumanDetection.ISap();
            this._hd.config = {
                protocol: hdConfig.protocol,
                ip: hdConfig.ip,
                port: hdConfig.port,
            };
            this._hd.score = hdConfig.target_score;

            this._hd.Initialization();

            this._cms = new CMSService();
            this._cms.config = {
                protocol: cmsConfig.protocol,
                ip: cmsConfig.ip,
                port: cmsConfig.port,
                account: cmsConfig.account,
                password: cmsConfig.password,
            };

            this._cms.Initialization();

            let delay: number = this.GetDelayTime();

            let sources: CMSService.ISource[] = this._devices.map((value, index, array) => {
                Print.Log(`(${value.getValue('floor').id}->${value.getValue('area').id}->${value.id}), ${value.getValue('name')}, Nvr: ${value.getValue('camera').getValue('config').nvrId}, Channel: ${value.getValue('camera').getValue('config').channelId}`, new Error(), 'info');

                return {
                    nvr: value.getValue('camera').getValue('config').nvrId,
                    channels: [value.getValue('camera').getValue('config').channelId],
                };
            });

            let next$: Rx.Subject<{}> = new Rx.Subject();

            this._cms.EnableLiveSubject(delay, hdConfig.cms.intervalSecond * 1000, hdConfig.cms.bufferCount, sources, hdConfig.cms.isLive);
            this._cms.liveStreamCatch$.subscribe({
                next: (x) => {
                    Print.Log(x, new Error(), 'error');
                },
            });
            this._cms.liveStream$
                .buffer(this._cms.liveStream$.bufferCount(hdConfig.bufferCount).merge(Rx.Observable.interval(1000)))
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        await Promise.all(
                            x.map(async (value, index, array) => {
                                try {
                                    let device = this._devices.find((value1, index1, array1) => {
                                        let config = value1.getValue('camera').getValue('config');
                                        return config.nvrId === value.nvr && config.channelId === value.channel;
                                    });

                                    let streamGroup = this._liveStreamGroups.find((value, index, array) => {
                                        return value.areaId === device.getValue('area').id;
                                    });

                                    let locations = await this._hd.GetAnalysis(value.image);

                                    if (locations.length > 0) {
                                        let rects: Draw.IRect[] = locations.map((value, index, array) => {
                                            return {
                                                x: value.x,
                                                y: value.y,
                                                width: value.width,
                                                height: value.height,
                                                color: hdConfig.output.rectangle.color,
                                                lineWidth: hdConfig.output.rectangle.lineWidth,
                                                isFill: hdConfig.output.rectangle.isFill,
                                            };
                                        });

                                        value.image = await Draw.Rectangle(rects, value.image);
                                    }

                                    value.image = await Draw.Resize(value.image, { width: hdConfig.output.image.width, height: hdConfig.output.image.height }, hdConfig.output.image.isFill, hdConfig.output.image.isTransparent);

                                    let reportHD: IDB.ReportHumanDetection = new IDB.ReportHumanDetection();

                                    reportHD.setValue('floor', device.getValue('floor'));
                                    reportHD.setValue('area', device.getValue('area'));
                                    reportHD.setValue('device', device);
                                    reportHD.setValue('date', new Date(value.timestamp));
                                    reportHD.setValue('imageSrc', '');
                                    reportHD.setValue('total', locations.length);
                                    reportHD.setValue('results', locations);

                                    await reportHD.save(null, { useMasterKey: true }).fail((e) => {
                                        throw e;
                                    });

                                    let imageSrc: string = `human_detection/${reportHD.id}_report_${reportHD.createdAt.getTime()}.${hdConfig.output.image.isTransparent ? 'png' : 'jpeg'}`;
                                    File.WriteFile(`${File.assetsPath}/${imageSrc}`, value.image);

                                    reportHD.setValue('imageSrc', imageSrc);

                                    let tasks: Promise<any>[] = [];

                                    tasks.push(reportHD.save(null, { useMasterKey: true }) as any);
                                    tasks.push(this.SaveReportSummary(reportHD, Enum.ESummaryType.hour));
                                    tasks.push(this.SaveReportSummary(reportHD, Enum.ESummaryType.day));
                                    tasks.push(this.SaveReportSummary(reportHD, Enum.ESummaryType.month));
                                    // tasks.push(this.SaveReportSummary(reportHD, Enum.ESummaryType.session));

                                    await Promise.all(tasks).catch((e) => {
                                        throw e;
                                    });

                                    streamGroup.liveStreamGroup$.next({
                                        floorId: device.getValue('floor').id,
                                        areaId: device.getValue('area').id,
                                        deviceId: device.id,
                                        count: locations.length,
                                    });
                                } catch (e) {
                                    Print.Log(e, new Error(), 'error');
                                }
                            }),
                        );

                        next$.next();
                    },
                    error: (e) => {
                        Print.Log(e, new Error(), 'error');
                    },
                    complete: () => {
                        Print.Log('Complete', new Error(), 'success');
                    },
                });
        } catch (e) {
            throw e;
        }
    };
}
export default new Service();

namespace Service {
    export interface ILiveStreamGroup {
        areaId: string;
        area: IDB.LocationArea;
        liveStreamGroup$: Rx.Subject<Service.ILiveStreamGroupData>;
    }

    export interface ILiveStreamGroupData {
        floorId: string;
        areaId: string;
        deviceId: string;
        count: number;
    }
}

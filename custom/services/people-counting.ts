import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, CMSService, HumanDetection, File, Draw, PeopleCounting } from '../helpers';
import * as Enum from '../enums';
import * as Action from '../actions';
import * as DataWindow from '../../cgi-bin/data-window/pc';
import * as Main from '../../main';

class Service {
    private _pcs: PeopleCounting.Eocortex[] = [];

    private _liveStreamGroups: Service.ILiveStreamGroup[] = [];

    private _save$: Rx.Subject<{ device: IDB.LocationDevice; count: PeopleCounting.Eocortex.ILiveStream }> = undefined;

    private _initialization$: Rx.Subject<{}> = new Rx.Subject();

    private _devices: IDB.LocationDevice[] = undefined;
    public get devices(): IDB.LocationDevice[] {
        return this._devices;
    }

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

        IDB.ConfigEocorpexServer$.subscribe({
            next: (x) => {
                if (x.crud === 'c' || x.crud === 'u' || x.crud === 'd') {
                    this._initialization$.next();
                }
            },
        });

        IDB.LocationFloor$.subscribe({
            next: (x) => {
                if (x.crud === 'd') {
                    this._initialization$.next();
                }
            },
        });

        IDB.LocationArea$.subscribe({
            next: (x) => {
                if (x.mode !== Enum.ECameraMode.peopleCounting) {
                    return;
                }

                if (x.crud === 'u' || x.crud === 'd') {
                    this._initialization$.next();
                }
            },
        });

        IDB.LocationDevice$.subscribe({
            next: (x) => {
                if (x.mode !== Enum.ECameraMode.peopleCounting) {
                    return;
                }

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

    private Initialization = async (): Promise<void> => {
        try {
            this.StopLiveStream();

            await this.Search();

            this.EnableLiveStreamGroup();
            this.EnableSaveStream();
            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    };

    private StopLiveStream = (): void => {
        try {
            this._pcs.forEach((value, index, array) => {
                value.liveStreamStop$.next();
            });
            this._pcs = [];
        } catch (e) {
            throw e;
        }
    };

    private Search = async (): Promise<void> => {
        try {
            this._devices = await new Parse.Query(IDB.LocationDevice)
                .equalTo('isDeleted', false)
                .equalTo('mode', Enum.ECameraMode.peopleCounting)
                .include(['floor', 'area', 'camera', 'camera.config.server'])
                .find()
                .fail((e) => {
                    throw e;
                });

            this._devices = this.devices.filter((value, index, array) => {
                return !value.getValue('floor').getValue('isDeleted') && !value.getValue('area').getValue('isDeleted');
            });

            this._devices.forEach((value, index, array) => {
                let config = value.getValue('camera').getValue('config') as IDB.IConfigEocorpexCamera;
                Print.Log(`People Counting: (${value.getValue('floor').id}->${value.getValue('area').id}->${value.id}->${value.getValue('camera').id}), ${value.getValue('name')}, Id: ${config.id}`, new Error(), 'info');
            });
        } catch (e) {
            throw e;
        }
    };

    private SaveReportSummary = async (device: IDB.LocationDevice, count: PeopleCounting.Eocortex.ILiveStream, type: Enum.ESummaryType): Promise<Service.ISaveReportSummary> => {
        try {
            let currDate: Date = new Date(count.date);
            let prevDate: Date = new Date(count.date);
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
            }

            let query: Parse.Query<IDB.ReportPeopleCountingSummary> = new Parse.Query(IDB.ReportPeopleCountingSummary).equalTo('device', device).equalTo('type', type);

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

            let prevCount: PeopleCounting.Eocortex.ICount = {
                in: prevSummary ? parseInt(prevSummary.getValue('inTotal')) : 0,
                out: prevSummary ? parseInt(prevSummary.getValue('outTotal')) : 0,
            };

            if (!currSummary) {
                currSummary = new IDB.ReportPeopleCountingSummary();

                currSummary.setValue('floor', device.getValue('floor'));
                currSummary.setValue('area', device.getValue('area'));
                currSummary.setValue('device', device);
                currSummary.setValue('type', type);
                currSummary.setValue('date', currDate);
            }

            currSummary.setValue('in', count.in - prevCount.in);
            currSummary.setValue('out', count.out - prevCount.out);
            currSummary.setValue('inTotal', count.in.toString());
            currSummary.setValue('outTotal', count.out.toString());

            await currSummary.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return {
                device: device,
                type: type,
                in: currSummary.getValue('in'),
                out: currSummary.getValue('out'),
            };
        } catch (e) {
            throw e;
        }
    };

    private EnableSaveStream = (): void => {
        try {
            this._save$ = new Rx.Subject();
            let next$: Rx.Subject<{}> = new Rx.Subject();

            this._save$
                .zip(next$.startWith(0))
                .map((x) => x[0])
                .subscribe({
                    next: async (x) => {
                        try {
                            let tasks: Promise<any>[] = [];

                            tasks.push(this.SaveReportSummary(x.device, x.count, Enum.ESummaryType.hour));
                            tasks.push(this.SaveReportSummary(x.device, x.count, Enum.ESummaryType.day));
                            tasks.push(this.SaveReportSummary(x.device, x.count, Enum.ESummaryType.month));

                            let summarys: Service.ISaveReportSummary[] = await Promise.all(tasks).catch((e) => {
                                throw e;
                            });

                            let streamGroup = this._liveStreamGroups.find((value, index, array) => {
                                return value.areaId === x.device.getValue('area').id;
                            });

                            let now = summarys.find((value, index, array) => {
                                return value.type === Enum.ESummaryType.hour;
                            });
                            let today = summarys.find((value, index, array) => {
                                return value.type === Enum.ESummaryType.day;
                            });

                            streamGroup.liveStreamGroup$.next({
                                floorId: x.device.getValue('floor').id,
                                areaId: x.device.getValue('area').id,
                                deviceId: x.device.id,
                                in: now.in,
                                out: now.out,
                                inToday: today.in,
                                outToday: today.out,
                            });
                        } catch (e) {
                            Print.Log(e, new Error(), 'error');
                        }

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
                                let prev = groupDatas.reduce(
                                    (prev, curr, index, array) => {
                                        return {
                                            in: prev.in + curr.in,
                                            out: prev.out + curr.out,
                                            inToday: prev.inToday + curr.inToday,
                                            outToday: prev.outToday + curr.outToday,
                                        };
                                    },
                                    {
                                        in: 0,
                                        out: 0,
                                        inToday: 0,
                                        outToday: 0,
                                    },
                                );

                                let groupData = groupDatas.find((n) => n.deviceId === x.deviceId);
                                if (!groupData) {
                                    groupDatas.push({
                                        floorId: x.floorId,
                                        areaId: x.areaId,
                                        deviceId: x.deviceId,
                                        in: x.in,
                                        out: x.out,
                                        inToday: x.inToday,
                                        outToday: x.outToday,
                                    });
                                } else {
                                    groupData.in = x.in;
                                    groupData.out = x.out;
                                    groupData.inToday = x.inToday;
                                    groupData.outToday = x.outToday;
                                }

                                let curr = groupDatas.reduce(
                                    (prev, curr, index, array) => {
                                        return {
                                            in: prev.in + curr.in,
                                            out: prev.out + curr.out,
                                            inToday: prev.inToday + curr.inToday,
                                            outToday: prev.outToday + curr.outToday,
                                        };
                                    },
                                    {
                                        in: 0,
                                        out: 0,
                                        inToday: 0,
                                        outToday: 0,
                                    },
                                );

                                DataWindow.push$.next({
                                    floorId: x.floorId,
                                    areaId: x.areaId,
                                    ...curr,
                                });

                                let prevCount = prev.inToday - prev.outToday;
                                let currCount = curr.inToday - curr.outToday;
                                Action.Smtp.action$.next({
                                    areaName: x.areaName,
                                    rules: JSON.parse(JSON.stringify(x.action.smtp)),
                                    prev: prevCount,
                                    curr: currCount,
                                });

                                Action.Sgsms.action$.next({
                                    areaName: x.areaName,
                                    rules: JSON.parse(JSON.stringify(x.action.sgsms)),
                                    prev: prevCount,
                                    curr: currCount,
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
            let pcConfig = Config.peopleCounting;

            let groups: Service.IDeviceGroup[] = this._devices.reduce<Service.IDeviceGroup[]>((prev, curr, index, array) => {
                if (curr.getValue('camera').getValue('type') === Enum.ECameraType.eocortex) {
                    let config = curr.getValue('camera').getValue('config') as IDB.IConfigEocorpexCamera;
                    let group = prev.find((value1, index1, array1) => {
                        return value1.server.id === config.server.id;
                    });

                    if (group) {
                        group.channels.push({
                            device: curr,
                            id: config.id,
                        });
                    } else {
                        prev.push({
                            server: config.server,
                            channels: [
                                {
                                    device: curr,
                                    id: config.id,
                                },
                            ],
                        });
                    }
                }

                return prev;
            }, []);

            groups.forEach((value, index, array) => {
                let pc: PeopleCounting.Eocortex = new PeopleCounting.Eocortex();
                pc.config = {
                    protocol: value.server.getValue('protocol'),
                    ip: value.server.getValue('ip'),
                    port: value.server.getValue('port'),
                    account: value.server.getValue('account'),
                    password: value.server.getValue('password'),
                };

                pc.Initialization();

                let next$: Rx.Subject<{}> = new Rx.Subject();

                pc.EnableLiveSubject(0, pcConfig.intervalSecond * 1000, pcConfig.bufferCount, value.channels.map((n) => n.id));
                pc.liveStreamCatch$.subscribe({
                    next: (x) => {
                        Print.Log(x, new Error(), 'error');
                    },
                });
                pc.liveStream$
                    .buffer(pc.liveStream$.bufferCount(pcConfig.bufferCount).merge(Rx.Observable.interval(1000)))
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
                                            let config = value1.getValue('camera').getValue('config') as IDB.IConfigEocorpexCamera;
                                            return config.id === value.channelId;
                                        });

                                        this._save$.next({
                                            device: device,
                                            count: value,
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

                this._pcs.push(pc);
            });

            this._devices
                .filter((value, index, array) => {
                    return value.getValue('camera').getValue('type') === Enum.ECameraType.dahua;
                })
                .forEach((value, index, array) => {
                    let config = value.getValue('camera').getValue('config') as IDB.IConfigDahuaCamera;

                    let pc: PeopleCounting.Dahua = new PeopleCounting.Dahua();
                    pc.config = {
                        protocol: config.protocol,
                        ip: config.ip,
                        port: config.port,
                        account: config.account,
                        password: config.password,
                    };

                    pc.Initialization();

                    let next$: Rx.Subject<{}> = new Rx.Subject();

                    pc.EnableLiveSubject(pcConfig.intervalSecond * 1000);
                    pc.liveStreamCatch$.subscribe({
                        next: (x) => {
                            Print.Log(x, new Error(), 'error');
                        },
                    });
                    pc.liveStream$
                        .buffer(pc.liveStream$.bufferCount(pcConfig.bufferCount).merge(Rx.Observable.interval(1000)))
                        .zip(next$.startWith(0))
                        .map((x) => {
                            return x[0];
                        })
                        .subscribe({
                            next: async (x) => {
                                await Promise.all(
                                    x.map(async (value1, index1, array1) => {
                                        try {
                                            this._save$.next({
                                                device: value,
                                                count: {
                                                    channelId: '',
                                                    date: new Date(),
                                                    in: value1.in,
                                                    out: value1.out,
                                                },
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
                });
        } catch (e) {
            throw e;
        }
    };
}
export default new Service();

namespace Service {
    export interface IDeviceGroup {
        server: IDB.ConfigEocorpexServer;
        channels: {
            device: IDB.LocationDevice;
            id: string;
        }[];
    }

    export interface ILiveStreamGroup {
        areaId: string;
        area: IDB.LocationArea;
        liveStreamGroup$: Rx.Subject<Service.ILiveStreamGroupData>;
    }

    export interface ILiveStreamGroupData {
        floorId: string;
        areaId: string;
        deviceId: string;
        in: number;
        out: number;
        inToday: number;
        outToday: number;
    }

    export interface ISaveReportSummary {
        device: IDB.LocationDevice;
        type: Enum.ESummaryType;
        in: number;
        out: number;
    }
}

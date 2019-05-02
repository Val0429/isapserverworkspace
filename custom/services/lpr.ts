import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, LPR } from '../helpers';
import * as Enum from '../enums';
import * as DataWindow from '../../cgi-bin/data-window';

class Service {
    private _liveStreamGroups: Service.ILiveStreamGroup[] = [];

    private _groups: { stationId: number; floorId: string; deviceId: string }[] = [];

    private _groupDatas: Service.ILiveStreamGroupData[] = [];

    private _maxLength: number = 10;

    private _nameLists: IDB.RuleNameList[] = [];

    private _push$: Rx.Subject<{}> = new Rx.Subject();
    public get push$(): Rx.Subject<{}> {
        return this._push$;
    }

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

            this.EnablePushStream();
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
                .include(['floor', 'camera'])
                .find()
                .fail((e) => {
                    throw e;
                });

            this._devices = this.devices.filter((value, index, array) => {
                return !value.getValue('floor').getValue('isDeleted');
            });

            this._groups = this._devices.map((value, index, array) => {
                return {
                    floorId: value.getValue('floor').id,
                    deviceId: value.id,
                    stationId: value.getValue('camera').getValue('stationId'),
                };
            });

            let reportLPR: IDB.ReportLPR[] = await new Parse.Query(IDB.ReportLPR)
                .containedIn('stationId', this._groups.map((n) => n.stationId))
                .descending('date')
                .find()
                .fail((e) => {
                    throw e;
                });

            this._groupDatas = reportLPR.reduce<Service.ILiveStreamGroupData[]>((prev, curr, index, array) => {
                let group = this._groups.find((value1, index1, array1) => {
                    return value1.stationId === curr.getValue('stationId');
                });

                let groupData = prev.find((value1, index1, array1) => {
                    return value1.stationId === curr.getValue('stationId');
                });
                if (groupData) {
                    if (groupData.datas.length < 10) {
                        groupData.datas.push({
                            plateNo: curr.getValue('plateNo'),
                            identification: '',
                            date: curr.getValue('date'),
                        });
                    }
                } else {
                    prev.push({
                        floorId: group.floorId,
                        deviceId: group.deviceId,
                        stationId: group.stationId,
                        datas: [
                            {
                                plateNo: curr.getValue('plateNo'),
                                identification: '',
                                date: curr.getValue('date'),
                            },
                        ],
                    });
                }

                return prev;
            }, []);

            IDB.RuleNameList$.startWith(0).subscribe({
                next: async (x) => {
                    try {
                        this._nameLists = await new Parse.Query(IDB.RuleNameList).find().fail((e) => {
                            throw e;
                        });

                        this._push$.next();
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
                },
            });
        } catch (e) {
            throw e;
        }
    };

    private EnablePushStream = async (): Promise<void> => {
        try {
            this._push$.subscribe({
                next: (x) => {
                    try {
                        let groupDatas: Service.ILiveStreamGroupData[] = JSON.parse(JSON.stringify(this._groupDatas));

                        groupDatas = groupDatas.map((value, index, array) => {
                            return {
                                ...value,
                                datas: value.datas.map((value1, index1, array1) => {
                                    let nameList = this._nameLists.find((value2, index2, array2) => {
                                        return value2.getValue('name') === value1.plateNo;
                                    });
                                    if (nameList) {
                                        return {
                                            ...value1,
                                            identification: Enum.EIdentificationType[nameList.getValue('type')],
                                        };
                                    } else {
                                        return {
                                            ...value1,
                                            identification: '',
                                        };
                                    }
                                }),
                            };
                        });

                        DataWindow.push$.next(groupDatas);
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
                },
            });
        } catch (e) {
            throw e;
        }
    };

    private EnableLiveStreamGroup = (): void => {
        try {
            this._liveStreamGroups = this._groups.map((value, index, array) => {
                let liveStreamGroup$: Rx.Subject<Service.ILiveStreamGroupPushData> = new Rx.Subject();
                liveStreamGroup$.subscribe({
                    next: (x) => {
                        try {
                            let groupData: Service.ILiveStreamGroupData = this._groupDatas.find((n) => n.stationId === x.stationId);
                            if (!groupData) {
                                this._groupDatas.push({
                                    floorId: value.floorId,
                                    deviceId: '',
                                    stationId: x.stationId,
                                    datas: [
                                        {
                                            plateNo: x.plateNo,
                                            identification: x.identification,
                                            date: x.date,
                                        },
                                    ],
                                });
                            } else {
                                groupData.datas.unshift({
                                    plateNo: x.plateNo,
                                    identification: x.identification,
                                    date: x.date,
                                });
                                groupData.datas.length = this._maxLength;
                            }

                            this._push$.next();
                        } catch (e) {
                            Print.Log(e, new Error(), 'error');
                        }
                    },
                });

                return {
                    floorId: value.floorId,
                    stationId: value.stationId,
                    liveStreamGroup$: liveStreamGroup$,
                };
            });
        } catch (e) {
            throw e;
        }
    };

    private EnableLiveStream = (): void => {
        try {
            let lprConfig = Config.lpr;

            let lpr: LPR.Optasia = new LPR.Optasia();
            lpr.config = {
                broadcastIp: lprConfig.broadcastIp,
                broadcastPort: lprConfig.broadcastPort,
            };

            lpr.Initialization();

            let next$: Rx.Subject<{}> = new Rx.Subject();

            lpr.EnableLiveSubject();
            lpr.liveStream$
                .buffer(lpr.liveStream$.bufferCount(10).merge(Rx.Observable.interval(1000)))
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        await Promise.all(
                            x.map(async (value, index, array) => {
                                try {
                                    let reportLPR: IDB.ReportLPR = new IDB.ReportLPR();

                                    reportLPR.setValue('date', value.date);
                                    reportLPR.setValue('plateNo', value.plateNo);
                                    reportLPR.setValue('stationId', value.stationId);

                                    await reportLPR.save(null, { useMasterKey: true }).fail((e) => {
                                        throw e;
                                    });

                                    let streamGroup = this._liveStreamGroups.find((value1, index1, array1) => {
                                        return value.stationId === value1.stationId;
                                    });
                                    if (streamGroup) {
                                        streamGroup.liveStreamGroup$.next({
                                            ...value,
                                            identification: '',
                                        });
                                    }
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
    export interface ILiveStreamGroupPushData extends LPR.Optasia.IResult {
        identification: string;
    }

    export interface ILiveStreamGroup {
        floorId: string;
        stationId: number;
        liveStreamGroup$: Rx.Subject<ILiveStreamGroupPushData>;
    }

    export interface ILiveStreamGroupData {
        floorId: string;
        deviceId: string;
        stationId: number;
        datas: {
            date: Date;
            plateNo: string;
            identification: string;
        }[];
    }
}

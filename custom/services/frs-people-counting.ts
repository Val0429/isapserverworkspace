import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, FRSService } from '../helpers';
import * as Enum from '../enums';
import * as DataWindow from '../../cgi-bin/data-window';

class Service {
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
            await this.EnableLiveStream();
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

            this._devices = this.devices.filter((value, index, array) => {
                return !value.getValue('floor').getValue('isDeleted') && !value.getValue('area').getValue('isDeleted');
            });

            this._devices.forEach((value, index, array) => {
                Print.Log(`${value.getValue('floor').getValue('name')}(${value.getValue('floor').id}) -> ${value.getValue('area').getValue('name')}(${value.getValue('area').id}) -> ${value.getValue('name')}(${value.id}) -> ${value.getValue('camera').getValue('name')}(${value.getValue('camera').id})`, new Error(), 'info');
            });
        } catch (e) {
            throw e;
        }
    };

    private EnableLiveStreamGroup(): void {
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

                let liveStreamGroup$: Rx.Subject<Service.ILiveStreamGroupPushData> = new Rx.Subject();
                liveStreamGroup$.subscribe({
                    next: (x) => {
                        try {
                            let groupData = groupDatas.find((n) => n.areaId === x.areaId);
                            if (groupData) {
                                groupData.in += x.in;
                                groupData.out += x.out;
                            } else {
                                groupDatas.push({
                                    floorId: x.floorId,
                                    areaId: x.areaId,
                                    in: x.in,
                                    out: x.out,
                                });
                            }

                            // Print.MinLog(JSON.stringify(groupDatas), 'success');

                            DataWindow.push$.next(JSON.parse(JSON.stringify(groupDatas)));
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
    }

    private async EnableLiveStream(): Promise<void> {
        try {
            let frs: FRSService = new FRSService();
            frs.analysisConfig = Config.frs.analysis;
            frs.manageConfig = Config.frs.manage;

            frs.Initialization();

            await frs.EnableLiveSubject();
            frs.liveStream$.subscribe({
                next: async (x) => {
                    try {
                        let device = this._devices.find((value1, index1, array1) => {
                            return value1.getValue('camera').getValue('name') === x.camera;
                        });

                        let streamGroup = this._liveStreamGroups.find((value, index, array) => {
                            return value.areaId === device.getValue('area').id;
                        });

                        if (streamGroup) {
                            let direction = device.getValue('direction');

                            // Print.MinLog(`${device.getValue('area').id}, ${Enum.EDeviceDirection[direction]}`, 'message');

                            streamGroup.liveStreamGroup$.next({
                                floorId: device.getValue('floor').id,
                                areaId: device.getValue('area').id,
                                deviceId: device.id,
                                in: direction === Enum.EDeviceDirection.in ? 1 : 0,
                                out: direction === Enum.EDeviceDirection.in ? 0 : 1,
                            });
                        }
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
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
    }
}
export default new Service();

namespace Service {
    export interface ILiveStreamGroupPushData {
        floorId: string;
        areaId: string;
        deviceId: string;
        in: number;
        out: number;
    }

    export interface ILiveStreamGroup {
        areaId: string;
        area: IDB.LocationArea;
        liveStreamGroup$: Rx.Subject<ILiveStreamGroupPushData>;
    }

    export interface ILiveStreamGroupData {
        floorId: string;
        areaId: string;
        in: number;
        out: number;
    }
}

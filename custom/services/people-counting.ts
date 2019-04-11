import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, PeopleCounting } from '../helpers';
import * as Enum from '../enums';
import * as Action from '../actions';
import * as DataWindow from '../../cgi-bin/data-window';

class Service {
    private _interval: number = Config.peopleCounting.intervalSecond * 1000;

    private _liveStreamGroups: Service.ILiveStreamGroup[] = [];

    private _sites: IDB.LocationSite[] = undefined;
    public get sites(): IDB.LocationSite[] {
        return this._sites;
    }

    private _devices: IDB.LocationDevice[] = undefined;
    public get devices(): IDB.LocationDevice[] {
        return this._devices;
    }

    private _groups: IDB.CameraGroup[] = undefined;
    public get groups(): IDB.CameraGroup[] {
        return this._groups;
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
            Print.MinLog(e, 'error');
        }
    };

    private Search = async (): Promise<void> => {
        try {
            this._sites = await new Parse.Query(IDB.LocationSite)
                .equalTo('isDeleted', false)
                .find()
                .fail((e) => {
                    throw e;
                });
            this._devices = await new Parse.Query(IDB.LocationDevice)
                .equalTo('isDeleted', false)
                .containedIn('site', this._sites)
                .include(['camera', 'site'])
                .find()
                .fail((e) => {
                    throw e;
                });
            this._groups = await new Parse.Query(IDB.CameraGroup)
                .equalTo('isDeleted', false)
                .containedIn('site', this._sites)
                .include(['site'])
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
            let target: Date = new Date(new Date(new Date(now).setMinutes(Math.ceil(now.getMinutes() + 1))).setSeconds(0, 0));
            let delay: number = target.getTime() - now.getTime();

            return delay;
        } catch (e) {
            throw e;
        }
    };

    private EnableLiveStreamGroup(): void {
        try {
            this._liveStreamGroups = this._groups.map((value, index, array) => {
                let counts: Service.ILiveStreamGroupData[] = [];

                let liveStreamGroup$: Rx.Subject<Service.ILiveStreamGroupData> = new Rx.Subject();
                liveStreamGroup$
                    .map((x) => {
                        return {
                            group: value,
                            ...x,
                        };
                    })
                    .subscribe({
                        next: (x) => {
                            let prev: number = counts.reduce((prev, curr, index, array) => {
                                return prev + curr.count.in - curr.count.out;
                            }, 0);

                            if (!counts.find((n) => n.deviceId === x.deviceId)) {
                                counts.push({
                                    regionId: x.regionId,
                                    siteId: x.siteId,
                                    deviceId: x.deviceId,
                                    count: x.count,
                                });
                            } else {
                                counts.find((n) => n.deviceId === x.deviceId).count = x.count;
                            }

                            let curr: number = counts.reduce((prev, curr, index, array) => {
                                return prev + curr.count.in - curr.count.out;
                            }, 0);

                            Action.HanwhaAircondition.action$.next({
                                group: x.group,
                                prev: prev,
                                curr: curr,
                            });
                        },
                    });

                return {
                    group: value,
                    siteId: value.getValue('site').id,
                    liveStreamGroup$: liveStreamGroup$,
                };
            });
        } catch (e) {
            throw e;
        }
    }

    private EnableLiveStream(): void {
        try {
            let delay: number = this.GetDelayTime();
            delay = 0;
            Rx.Observable.from(this._devices)
                .delay(delay)
                .map((x, index) => {
                    return { index, device: x };
                })
                .subscribe({
                    next: ({ index, device }) => {
                        let site: IDB.LocationSite = device.getValue('site');
                        let region: IDB.LocationRegion = site.getValue('region');
                        let camera: IDB.Camera = device.getValue('camera');
                        let streamGroup = this._liveStreamGroups.find((x) => x.siteId === site.id);
                        let group: IDB.CameraGroup = streamGroup.group;

                        Print.MinLog(`${index}. region: ${region.id}, site: ${site.id}, group: ${group.id}, device: ${device.id}, camera: ${camera.id}`, 'info');

                        if (camera.getValue('type') === Enum.CameraType.hanwha) {
                            let hanwha: PeopleCounting.Hanwha = new PeopleCounting.Hanwha();
                            hanwha.config = camera.getValue('config');

                            hanwha.Initialization();

                            hanwha.EnableLiveSubject(this._interval);

                            hanwha.liveStream$.subscribe({
                                next: (counts) => {
                                    let count = counts.length > 0 ? counts[0] : { in: 0, out: 0 };

                                    streamGroup.liveStreamGroup$.next({
                                        regionId: region.id,
                                        siteId: site.id,
                                        deviceId: device.id,
                                        count: count,
                                    });

                                    DataWindow.push$.next({
                                        regionId: region.id,
                                        siteId: site.id,
                                        deviceId: device.id,
                                        count: count,
                                    });
                                },
                                error: (e) => {
                                    Print.MinLog(`${camera.id}: ${e}`, 'error');
                                },
                                complete: () => {
                                    Print.MinLog(`${camera.id}: complete`, 'success');
                                },
                            });
                        }
                    },
                });
        } catch (e) {
            throw e;
        }
    }
}
export default new Service();

namespace Service {
    export interface ILiveStreamGroup {
        group: IDB.CameraGroup;
        siteId: string;
        liveStreamGroup$: Rx.Subject<Service.ILiveStreamGroupData>;
    }

    export interface ILiveStreamGroupData {
        regionId: string;
        siteId: string;
        deviceId: string;
        count: PeopleCounting.Hanwha.ICount;
    }
}

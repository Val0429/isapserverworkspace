import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, CMSService } from '../helpers';
import * as Enum from '../enums';
import * as Action from '../actions';
import * as Main from '../../main';

class Service {
    /**
     *
     */
    private _cmss: CMSService[] = [];
    public get cmss(): CMSService[] {
        return this._cmss;
    }

    /**
     *
     */
    private _cmsConfigs: IDB.ServerCMS[] = [];

    /**
     *
     */
    private _devices: IDB.Device[] = [];

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

        IDB.ServerCMS$.subscribe({
            next: (x) => {
                if (x.crud === 'u') {
                    initialization$.next();
                }
            },
        });

        IDB.Device$.subscribe({
            next: (x) => {
                if ((x.crud === 'c' || x.crud === 'u' || x.crud === 'd') && x.model === Enum.EDeviceModelIsap.cms) {
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
            this.Stop();

            await this.Search();

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
            (this._cmss || []).forEach((value, index, array) => {
                value.liveStreamStop$.next();
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search
     */
    private async Search(): Promise<void> {
        try {
            this._devices = await new Parse.Query(IDB.Device)
                .equalTo('brand', Enum.EDeviceBrand.isap)
                .equalTo('model', Enum.EDeviceModelIsap.cms)
                .notEqualTo('site', null)
                .notEqualTo('area', null)
                .include(['site', 'area', 'groups', 'config.server'])
                .find()
                .fail((e) => {
                    throw e;
                });

            this._cmsConfigs = this._devices.map((value, index, array) => {
                return (value.getValue('config') as IDB.ICameraFRS).server;
            });

            let cmsConfigIds = this._cmsConfigs.map((value, index, array) => {
                return value.id;
            });
            this._cmsConfigs = this._cmsConfigs.filter((value, index, array) => {
                return cmsConfigIds.indexOf(value.id) === index;
            });

            this._devices.forEach((value, index, array) => {
                let config: IDB.ICameraCMS = value.getValue('config') as IDB.ICameraCMS;
                Print.Log(`${value.getValue('area').id}(area)->${value.id}(device)->${config.server.id}(server)->${value.getValue('name')}`, new Error(), 'info');
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get delay time
     */
    private GetDelayTime(): number {
        try {
            let now: Date = new Date();
            let target: Date = new Date(new Date(new Date(now).setMinutes(Math.ceil((now.getMinutes() + 1) / 5) * 5)).setSeconds(0, 0));
            let delay: number = target.getTime() - now.getTime();

            return delay;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable live stream
     */
    private EnableLiveStream(): void {
        try {
            let cmsConfig = Config.sourceCms;

            this._cmss = this._cmsConfigs.map((value, index, array) => {
                let cms: CMSService = new CMSService();
                cms.config = {
                    protocol: value.getValue('protocol'),
                    ip: value.getValue('ip'),
                    port: value.getValue('port'),
                    account: value.getValue('account'),
                    password: value.getValue('password'),
                };

                cms.Initialization();

                let delay: number = this.GetDelayTime();

                let sources: CMSService.ISource[] = this._devices
                    .filter((value1, index1, array1) => {
                        return (value1.getValue('config') as IDB.ICameraFRS).server.id === value.id;
                    })
                    .map((value, index, array) => {
                        let config = value.getValue('config') as IDB.ICameraCMS;

                        return {
                            nvr: config.nvrId,
                            channels: [config.channelId],
                        };
                    });

                cms.EnableLiveSubject(delay, cmsConfig.snapshot.intervalSecond * 1000, cmsConfig.snapshot.bufferCount, sources, cmsConfig.snapshot.isLive);
                cms.liveStreamCatch$.subscribe({
                    next: (x) => {
                        Print.Log(`${value.id}(server) -> ${x}`, new Error(), 'error');
                    },
                });
                cms.liveStream$.subscribe({
                    next: async (x) => {
                        try {
                            let devices = this._devices.filter((value, index, array) => {
                                let config = value.getValue('config') as IDB.ICameraCMS;
                                return config.nvrId === x.nvr && config.channelId === x.channel;
                            });

                            devices.forEach((value, index, array) => {
                                switch (value.getValue('mode')) {
                                    case Enum.EDeviceMode.humanDetection:
                                        Action.HumanDetection.action$.next({
                                            device: value,
                                            date: new Date(x.timestamp),
                                            image: x.image,
                                        });
                                        break;
                                    case Enum.EDeviceMode.heatmap:
                                        break;
                                    default:
                                        throw `${value.id}(device) mode not found`;
                                }
                            });
                        } catch (e) {
                            Print.Log(`${value.id}(server) -> ${e}`, new Error(), 'error');
                        }
                    },
                    error: (e) => {
                        Print.Log(`${value.id}(server) -> ${e}`, new Error(), 'error');
                    },
                    complete: () => {
                        Print.Log(`${value.id}(server) -> Complete`, new Error(), 'success');
                    },
                });

                return cms;
            });
        } catch (e) {
            throw e;
        }
    }
}
export default new Service();

namespace Service {}

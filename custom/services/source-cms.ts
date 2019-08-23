import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB, IBase } from '../models';
import { Print, Utility, File, CMSService } from '../helpers';
import * as Enum from '../enums';
import * as Action from '../actions';
import * as Main from '../../main';

class Service {
    /**
     *
     */
    private _config = Config.sourceCms;

    /**
     *
     */
    private _initialization$: Rx.Subject<{}> = new Rx.Subject();

    /**
     *
     */
    private _cmss: Service.IObjectCMS = {};
    public get cmss(): CMSService[] {
        return Object.keys(this._cmss).map((value, index, array) => {
            return this._cmss[value].cms;
        });
    }

    /**
     *
     */
    private _devices: IDB.Device[] = [];

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

        IDB.ServerCMS.notice$.subscribe({
            next: (x) => {
                if (x.crud === 'u') {
                    this._initialization$.next();
                }
            },
        });

        IDB.Device.notice$.subscribe({
            next: (x) => {
                if ((x.crud === 'c' || x.crud === 'u' || x.crud === 'd') && x.data.get('model') === Enum.EDeviceModelIsap.cms) {
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
            Object.keys(this._cmss).forEach((value, index, array) => {
                let cms = this._cmss[value];

                cms.initialization$.complete();
                cms.cms.liveStreamStop$.next();
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

            this._cmss = {};
            this._devices.forEach((value, index, array) => {
                let server = (value.getValue('config') as IDB.ICameraCMS).server;
                let key: string = server.id;

                let cms: CMSService = new CMSService();
                cms.config = {
                    protocol: server.getValue('protocol'),
                    ip: server.getValue('ip'),
                    port: server.getValue('port'),
                    account: server.getValue('account'),
                    password: server.getValue('password'),
                };

                cms.Initialization();

                this._cmss[key] = {
                    server: server,
                    cms: cms,
                    initialization$: new Rx.Subject(),
                };
            });

            this._devices
                .sort((a, b) => {
                    return b.getValue('mode') - a.getValue('mode');
                })
                .forEach((value, index, array) => {
                    let config: IDB.ICameraCMS = value.getValue('config') as IDB.ICameraCMS;
                    Print.Log(`${value.getValue('area').id}(area)->${value.id}(device)->${config.server.id}(server)->${value.getValue('name')}(${Enum.EDeviceMode[value.getValue('mode')]})`, new Error(), 'info');
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
            Object.keys(this._cmss).forEach(async (value, index, array) => {
                let cms = this._cmss[value];

                let next$: Rx.Subject<{}> = new Rx.Subject();

                cms.initialization$.zip(next$.startWith(0)).subscribe({
                    next: async (x) => {
                        try {
                            cms.cms.liveStreamStop$.next();

                            let delay: number = this.GetDelayTime();

                            let sources: CMSService.ISource[] = this._devices
                                .filter((value1, index1, array1) => {
                                    return (value1.getValue('config') as IDB.ICameraFRS).server.id === value;
                                })
                                .reduce<CMSService.ISource[]>((prev, curr, index, array) => {
                                    let config = curr.getValue('config') as IDB.ICameraCMS;
                                    let source = prev.find((value1, index1, array1) => {
                                        return value1.nvr === config.nvrId;
                                    });
                                    if (source) {
                                        if (source.channels.indexOf(config.channelId) < 0) {
                                            source.channels.push(config.channelId);
                                        }
                                    } else {
                                        prev.push({
                                            nvr: config.nvrId,
                                            channels: [config.channelId],
                                        });
                                    }

                                    return prev;
                                }, []);

                            cms.cms.EnableLiveSubject(delay, this._config.snapshot.intervalSecond * 1000, this._config.snapshot.bufferCount, sources, this._config.snapshot.isLive);
                            cms.cms.liveStreamCatch$.subscribe({
                                next: (x) => {
                                    Print.Log(`${value}(server) -> ${x}`, new Error(), 'error');
                                },
                            });
                            cms.cms.liveStream$.subscribe({
                                next: async (x) => {
                                    try {
                                        let devices = this._devices.filter((value1, index1, array1) => {
                                            let config = value1.getValue('config') as IDB.ICameraCMS;
                                            return config.nvrId === x.nvr && config.channelId === x.channel && config.server.id === value;
                                        });

                                        devices.forEach((value1, index1, array1) => {
                                            let temp: string = `${File.assetsPath}/temp/${Utility.RandomText(10, { symbol: false })}_${new Date().getTime()}.png`;
                                            File.WriteFile(temp, x.image);

                                            switch (value1.getValue('mode')) {
                                                case Enum.EDeviceMode.humanDetection:
                                                    Action.AnalysisHumanDetection.action$.next({
                                                        type: 'humanDetection',
                                                        device: value1,
                                                        date: new Date(x.timestamp),
                                                        imagePath: temp,
                                                    });
                                                    break;
                                                case Enum.EDeviceMode.heatmap:
                                                    Action.AnalysisHumanDetection.action$.next({
                                                        type: 'heatmap',
                                                        device: value1,
                                                        date: new Date(x.timestamp),
                                                        imagePath: temp,
                                                    });
                                                    break;
                                                default:
                                                    Action.DeleteFile.action$.next(temp);
                                            }
                                        });

                                        x.image = null;
                                    } catch (e) {
                                        Print.Log(`${value}(server) -> ${e}`, new Error(), 'error');
                                    }
                                },
                                error: (e) => {
                                    Print.Log(`${value}(server) -> ${e}`, new Error(), 'error');
                                },
                                complete: () => {
                                    Print.Log(`${value}(server) -> Complete`, new Error(), 'success');
                                },
                            });
                        } catch (e) {
                            Print.Log(`${value}(server) -> ${e}`, new Error(), 'error');

                            await Utility.Delay(60000);
                            cms.initialization$.next();
                        } finally {
                            next$.next();
                        }
                    },
                    error: (e) => {
                        Print.Log(`${value}(server) -> ${e}`, new Error(), 'error');
                    },
                    complete: () => {
                        Print.Log(`${value}(server) -> Complete`, new Error(), 'success');
                    },
                });

                cms.initialization$.next();
            });
        } catch (e) {
            throw e;
        }
    }
}
export default new Service();

namespace Service {
    /**
     *
     */
    export interface IObjectCMS extends IBase.IObject.IKeyValue<ICMS> {}

    /**
     *
     */
    export interface ICMS {
        server: IDB.ServerCMS;
        cms: CMSService;
        initialization$: Rx.Subject<{}>;
    }
}

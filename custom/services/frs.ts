import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Utility, File, FRSService } from '../helpers';
import * as Enum from '../enums';
import * as Action from '../actions';
import * as Main from '../../main';

class Service {
    /**
     *
     */
    private _initialization$: Rx.Subject<{}> = new Rx.Subject();

    /**
     *
     */
    private _frss: FRSService[] = [];
    public get frss(): FRSService[] {
        return this._frss;
    }

    /**
     *
     */
    private _frsConfigs: IDB.ServerFRS[] = [];

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

        IDB.ServerFRS.notice$.subscribe({
            next: (x) => {
                if (x.crud === 'u') {
                    this._initialization$.next();
                }
            },
        });

        IDB.Device.notice$.subscribe({
            next: (x) => {
                if ((x.crud === 'c' || x.crud === 'u' || x.crud === 'd') && x.data.get('model') === Enum.EDeviceModelIsap.frs) {
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

            await this.EnableLiveStream();

            this._devices
                .sort((a, b) => {
                    return b.getValue('mode') - a.getValue('mode');
                })
                .forEach((value, index, array) => {
                    let config: IDB.ICameraFRS = value.getValue('config') as IDB.ICameraFRS;
                    Print.Log(`${value.getValue('area').id}(area)->${value.id}(device)->${config.server.id}(server)->${value.getValue('name')}(${Enum.EDeviceMode[value.getValue('mode')]})`, new Error(), 'info');
                });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            this._initialization$.next();
        }
    }

    /**
     * Stop
     */
    private Stop(): void {
        try {
            (this._frss || []).forEach((value, index, array) => {
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
                .equalTo('model', Enum.EDeviceModelIsap.frs)
                .notEqualTo('site', null)
                .notEqualTo('area', null)
                .include(['site', 'area', 'groups', 'config.server'])
                .find()
                .fail((e) => {
                    throw e;
                });

            this._frsConfigs = this._devices.map((value, index, array) => {
                return (value.getValue('config') as IDB.ICameraFRS).server;
            });

            let frsConfigIds = this._frsConfigs.map((value, index, array) => {
                return value.id;
            });
            this._frsConfigs = this._frsConfigs.filter((value, index, array) => {
                return frsConfigIds.indexOf(value.id) === index;
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable live stream
     */
    private async EnableLiveStream(): Promise<void> {
        try {
            this._frss = await Promise.all(
                this._frsConfigs.map(async (value, index, array) => {
                    let frs: FRSService = new FRSService();
                    frs.config = {
                        protocol: value.getValue('protocol'),
                        ip: value.getValue('ip'),
                        port: value.getValue('port'),
                        wsport: value.getValue('wsport'),
                        account: value.getValue('account'),
                        password: value.getValue('password'),
                    };

                    frs.Initialization();

                    await frs.Login();

                    await frs.EnableLiveSubject();
                    frs.liveStreamCatch$.subscribe({
                        next: (x) => {
                            Print.Log(`${value.id}(server) -> ${x}`, new Error(), 'error');
                        },
                    });
                    frs.liveStreamClose$.subscribe({
                        next: (x) => {
                            this._initialization$.next();
                        },
                    });
                    frs.liveStream$.subscribe({
                        next: async (x) => {
                            try {
                                let temp: string = `${File.assetsPath}/temp/${Utility.RandomText(10, { symbol: false })}_${new Date().getTime()}.png`;
                                File.WriteFile(temp, x.image);
                                x.image = null;

                                let devices = this._devices.filter((value1, index1, array1) => {
                                    let config = value1.getValue('config') as IDB.ICameraFRS;
                                    return config.sourceid === x.camera;
                                });

                                let groups = x.groups
                                    .map<Enum.EPeopleType>((value1, index1, array1) => {
                                        let group = value.getValue('userGroups').find((value2, index2, array2) => {
                                            return value2.objectId === value1.objectId;
                                        });
                                        if (group) {
                                            return group.type;
                                        }

                                        return undefined;
                                    })
                                    .filter((value1, index1, array1) => {
                                        return !!value1;
                                    });

                                devices.forEach((value1, index1, array1) => {
                                    switch (value1.getValue('mode')) {
                                        case Enum.EDeviceMode.peopleCounting:
                                            Action.PeopleCountingSeparation.action$.next({
                                                device: value1,
                                                date: x.date,
                                                groups: groups,
                                            });
                                            break;
                                        case Enum.EDeviceMode.dwellTime:
                                            break;
                                        case Enum.EDeviceMode.demographic:
                                            Action.Demographic.action$.next({
                                                device: value1,
                                                date: x.date,
                                                image: temp,
                                                groups: groups,
                                            });
                                            break;
                                        case Enum.EDeviceMode.visitor:
                                            break;
                                        default:
                                            throw `${value1.id}(device) mode not found`;
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

                    return frs;
                }),
            ).catch((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }
}
export default new Service();

namespace Service {}
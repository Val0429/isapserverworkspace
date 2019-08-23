import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB, IBase } from '../models';
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
    private _frss: IBase.IObject.IKeyValue<Service.IFRS> = {};
    public get frss(): FRSService[] {
        return Object.keys(this._frss).map((value, index, array) => {
            return this._frss[value].frs;
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
            Object.keys(this._frss).forEach((value, index, array) => {
                let frs = this._frss[value];

                frs.initialization$.complete();
                frs.frs.liveStreamStop$.next();
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

            this._frss = {};
            this._devices.forEach((value, index, array) => {
                let server = (value.getValue('config') as IDB.ICameraFRS).server;
                let key: string = server.id;

                let frs: FRSService = new FRSService();
                frs.config = {
                    protocol: server.getValue('protocol'),
                    ip: server.getValue('ip'),
                    port: server.getValue('port'),
                    wsport: server.getValue('wsport'),
                    account: server.getValue('account'),
                    password: server.getValue('password'),
                };

                frs.Initialization();

                this._frss[key] = {
                    server: server,
                    frs: frs,
                    initialization$: new Rx.Subject(),
                };
            });

            this._devices
                .sort((a, b) => {
                    return b.getValue('mode') - a.getValue('mode');
                })
                .forEach((value, index, array) => {
                    let config: IDB.ICameraFRS = value.getValue('config') as IDB.ICameraFRS;
                    Print.Log(`${value.getValue('area').id}(area)->${value.id}(device)->${config.server.id}(server)->${value.getValue('name')}(${Enum.EDeviceMode[value.getValue('mode')]})`, new Error(), 'info');
                });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable live stream
     */
    private EnableLiveStream(): void {
        try {
            Object.keys(this._frss).forEach(async (value, index, array) => {
                let frs = this._frss[value];

                let next$: Rx.Subject<{}> = new Rx.Subject();

                frs.initialization$.zip(next$.startWith(0)).subscribe({
                    next: async (x) => {
                        try {
                            frs.frs.liveStreamStop$.next();

                            await frs.frs.Login();

                            await frs.frs.EnableLiveSubject();
                            frs.frs.liveStreamCatch$.subscribe({
                                next: (x) => {
                                    Print.Log(`${value}(server) -> ${x}`, new Error(), 'error');
                                },
                            });
                            frs.frs.liveStreamClose$.subscribe({
                                next: async (x) => {
                                    Print.Log(`${value}(server) -> close`, new Error(), 'error');

                                    await Utility.Delay(60000);
                                    frs.initialization$.next();
                                },
                            });
                            frs.frs.liveStream$.subscribe({
                                next: async (x) => {
                                    try {
                                        let devices = this._devices.filter((value1, index1, array1) => {
                                            let config = value1.getValue('config') as IDB.ICameraFRS;
                                            return config.sourceid === x.camera && config.server.id === value;
                                        });

                                        let groups = x.groups
                                            .map<Enum.EPeopleType>((value1, index1, array1) => {
                                                let group = frs.server.getValue('userGroups').find((value2, index2, array2) => {
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

                                        let isEmployee = groups.indexOf(Enum.EPeopleType.employee) > -1;

                                        devices.forEach((value1, index1, array1) => {
                                            let temp: string = `${File.assetsPath}/temp/${Utility.RandomText(10, { symbol: false })}_${new Date().getTime()}.png`;
                                            File.WriteFile(temp, x.image);

                                            switch (value1.getValue('mode')) {
                                                case Enum.EDeviceMode.peopleCounting:
                                                    Action.AnalysisPeopleCounting.action$.next({
                                                        type: 'separation',
                                                        device: value1,
                                                        date: x.date,
                                                        imagePath: temp,
                                                        isEmployee: isEmployee,
                                                    });
                                                    break;
                                                case Enum.EDeviceMode.demographic:
                                                    Action.AnalysisDemographic.action$.next({
                                                        type: 'demographic',
                                                        device: value1,
                                                        date: x.date,
                                                        imagePath: temp,
                                                        groups: groups,
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
                            frs.initialization$.next();
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

                frs.initialization$.next();
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
    export interface IFRS {
        server: IDB.ServerFRS;
        frs: FRSService;
        initialization$: Rx.Subject<{}>;
    }
}

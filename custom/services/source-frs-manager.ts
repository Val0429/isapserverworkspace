import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB, IBase } from '../models';
import { Print, File, Utility, FRSManagerService } from '../helpers';
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
    private _frsManagers: IBase.IObject.IKeyValue<Service.IFRSManager> = {};
    public get frsManagers(): FRSManagerService[] {
        return Object.keys(this._frsManagers).map((value, index, array) => {
            return this._frsManagers[value].frsManager;
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

        IDB.ServerFRSManager.notice$.subscribe({
            next: (x) => {
                if (x.crud === 'u') {
                    this._initialization$.next();
                }
            },
        });

        IDB.Device.notice$.subscribe({
            next: (x) => {
                if ((x.crud === 'c' || x.crud === 'u' || x.crud === 'd') && x.data.get('model') === Enum.EDeviceModelIsap.frsManager) {
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
            Object.keys(this._frsManagers).forEach((value, index, array) => {
                let frsManager = this._frsManagers[value];

                frsManager.initialization$.complete();
                frsManager.frsManager.liveStreamStop$.next();
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
                .equalTo('model', Enum.EDeviceModelIsap.frsManager)
                .notEqualTo('site', null)
                .notEqualTo('area', null)
                .include(['site', 'area', 'groups', 'config.server'])
                .find()
                .fail((e) => {
                    throw e;
                });

            this._frsManagers = {};
            this._devices.forEach((value, index, array) => {
                let server = (value.getValue('config') as IDB.ICameraFRSManager).server;
                let key: string = server.id;

                let frsManager: FRSManagerService = new FRSManagerService();
                frsManager.config = {
                    protocol: server.getValue('protocol'),
                    ip: server.getValue('ip'),
                    port: server.getValue('port'),
                    account: server.getValue('account'),
                    password: server.getValue('password'),
                };

                frsManager.Initialization();

                this._frsManagers[key] = {
                    server: server,
                    frsManager: frsManager,
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
            Object.keys(this._frsManagers).forEach(async (value, index, array) => {
                let frsManager = this._frsManagers[value];

                let next$: Rx.Subject<{}> = new Rx.Subject();

                frsManager.initialization$.zip(next$.startWith(0)).subscribe({
                    next: async (x) => {
                        try {
                            frsManager.frsManager.liveStreamStop$.next();

                            await frsManager.frsManager.Login();

                            await frsManager.frsManager.EnableLiveSubject();
                            frsManager.frsManager.liveStreamCatch$.subscribe({
                                next: (x) => {
                                    Print.Log(`${value}(server) -> ${x}`, new Error(), 'error');
                                },
                            });
                            frsManager.frsManager.liveStreamClose$.subscribe({
                                next: async (x) => {
                                    Print.Log(`${value}(server) -> close`, new Error(), 'error');

                                    await Utility.Delay(60000);
                                    frsManager.initialization$.next();
                                },
                            });
                            frsManager.frsManager.liveStream$.subscribe({
                                next: async (x) => {
                                    try {
                                        let devices = this._devices.filter((value1, index1, array1) => {
                                            let config = value1.getValue('config') as IDB.ICameraFRSManager;
                                            return config.sourceId === x.camera && config.frsId === x.frsId && config.server.id === value;
                                        });

                                        let groups = x.groups
                                            .map<Enum.EPeopleType>((value1, index1, array1) => {
                                                let group = frsManager.server.getValue('userGroups').find((value2, index2, array2) => {
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
                                                case Enum.EDeviceMode.dwellTime:
                                                    Action.DeleteFile.action$.next(temp);
                                                    break;
                                                case Enum.EDeviceMode.visitor:
                                                    Action.DeleteFile.action$.next(temp);
                                                    break;
                                                default:
                                                    Action.DeleteFile.action$.next(temp);
                                                    throw `${value1.id}(device) mode not found`;
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
                            frsManager.initialization$.next();
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

                frsManager.initialization$.next();
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
    export interface IFRSManager {
        server: IDB.ServerFRSManager;
        frsManager: FRSManagerService;
        initialization$: Rx.Subject<{}>;
    }
}

import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, PeopleCounting } from '../helpers';
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
    private _hanwhas: PeopleCounting.Hanwha[] = [];
    public get hanwhas(): PeopleCounting.Hanwha[] {
        return this._hanwhas;
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

        IDB.Device.notice$.subscribe({
            next: (x) => {
                if ((x.crud === 'c' || x.crud === 'u' || x.crud === 'd') && x.data.get('brand') === Enum.EDeviceBrand.hanwha) {
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
            (this._hanwhas || []).forEach((value, index, array) => {
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
                .equalTo('brand', Enum.EDeviceBrand.hanwha)
                .notEqualTo('site', null)
                .notEqualTo('area', null)
                .include(['site', 'area', 'groups', 'config.server'])
                .find()
                .fail((e) => {
                    throw e;
                });

            this._devices
                .sort((a, b) => {
                    return b.getValue('mode') - a.getValue('mode');
                })
                .forEach((value, index, array) => {
                    let config: IDB.ICameraHanwha = value.getValue('config') as IDB.ICameraHanwha;
                    Print.Log(`${value.getValue('area').id}(area)->${value.id}(device)->${config.ip}(server)->${value.getValue('name')}(${Enum.EDeviceMode[value.getValue('mode')]})`, new Error(), 'info');
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
            let hanwhaConfig = Config.sourceHanwha;

            this._hanwhas = this._devices.map((value, index, array) => {
                let config: IDB.ICameraHanwha = value.getValue('config') as IDB.ICameraHanwha;

                let hanwha: PeopleCounting.Hanwha = new PeopleCounting.Hanwha();
                hanwha.config = {
                    protocol: config.protocol,
                    ip: config.ip,
                    port: config.port,
                    account: config.account,
                    password: config.password,
                };

                hanwha.Initialization();

                hanwha.EnableLiveSubject(hanwhaConfig.intervalSecond);
                hanwha.liveStreamCatch$.subscribe({
                    next: (x) => {
                        Print.Log(`${value.id}(device) -> ${x}`, new Error(), 'error');
                    },
                });
                hanwha.liveStream$.subscribe({
                    next: async (x) => {
                        try {
                            let count = x.length > 0 ? x[0] : { in: 0, out: 0 };

                            switch (value.getValue('mode')) {
                                case Enum.EDeviceMode.peopleCounting:
                                    Action.AnalysisPeopleCountingMerge.action$.next({
                                        device: value,
                                        date: new Date(),
                                        in: count.in,
                                        out: count.out,
                                    });
                                    break;
                                default:
                                    throw `${value.id}(device) mode not found`;
                            }
                        } catch (e) {
                            Print.Log(`${value.id}(device) -> ${e}`, new Error(), 'error');
                        }
                    },
                    error: (e) => {
                        Print.Log(`${value.id}(device) -> ${e}`, new Error(), 'error');
                    },
                    complete: () => {
                        Print.Log(`${value.id}(device) -> Complete`, new Error(), 'success');
                    },
                });

                return hanwha;
            });
        } catch (e) {
            throw e;
        }
    }
}
export default new Service();

namespace Service {}

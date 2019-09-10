import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, File, Demographic } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';
import { DeleteFile, SaveDemographic, SaveRepeatVisitor, SaveDwellTime } from './';

class Action {
    /**
     *
     */
    private _initialization$: Rx.Subject<{}> = new Rx.Subject();

    /**
     *
     */
    private _config = Config.deviceDemographic;

    /**
     *
     */
    private _demos: Action.IDemo[] = [];
    public get demos(): Action.IDemo[] {
        return this._demos;
    }

    /**
     *
     */
    private _action$: Rx.Subject<Action.IAction> = new Rx.Subject();
    public get action$(): Rx.Subject<Action.IAction> {
        return this._action$;
    }

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

        IDB.ServerDemographic.notice$.subscribe({
            next: (x) => {
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
            this._action$.complete();
            this._action$ = new Rx.Subject();
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search
     */
    private async Search(): Promise<void> {
        try {
            let servers: IDB.ServerDemographic[] = await new Parse.Query(IDB.ServerDemographic).find().fail((e) => {
                throw e;
            });

            this._demos = servers.map((value, index, array) => {
                Print.Log(`${value.id}(server)->${value.getValue('name')}`, new Error(), 'info');

                let demo: Demographic.ISap = new Demographic.ISap();
                demo.config = {
                    protocol: value.getValue('protocol'),
                    ip: value.getValue('ip'),
                    port: value.getValue('port'),
                };
                demo.margin = value.getValue('margin');

                demo.Initialization();

                return {
                    objectId: value.id,
                    name: value.getValue('name'),
                    demo: demo,
                };
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
            let next$: Rx.Subject<{}> = new Rx.Subject();

            this._action$
                .buffer(this._action$.bufferCount(this._config.bufferCount).merge(Rx.Observable.interval(1000)))
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        try {
                            await Promise.all(
                                x.map(async (value, index, array) => {
                                    let buffer: Buffer = null;

                                    try {
                                        let site: IDB.LocationSite = value.device.getValue('site');
                                        let area: IDB.LocationArea = value.device.getValue('area');
                                        let groups: IDB.DeviceGroup[] = value.device.getValue('groups');
                                        let device: IDB.Device = value.device;

                                        let demo: Action.IDemo = this._demos.find((value1, index1, array1) => {
                                            return value1.objectId === device.getValue('demoServer').id;
                                        });
                                        if (!demo) {
                                            throw `${device.id}(device) -> demographic server not found`;
                                        }

                                        buffer = File.ReadFile(value.imagePath);
                                        DeleteFile.action$.next(value.imagePath);

                                        let feature = await demo.demo.GetAnalysis(buffer);
                                        if (!feature) {
                                            return;
                                        }

                                        let base: IDB.IReportBase = {
                                            site: site,
                                            area: area,
                                            device: device,
                                            date: value.date,
                                        };

                                        if (value.type === 'repeatVisitor') {
                                            SaveRepeatVisitor.action$.next({
                                                base: base,
                                                buffer: buffer,
                                                feature: feature,
                                                faceId: value.faceId,
                                            });
                                        } else if (value.type === 'demographic') {
                                            SaveDemographic.action$.next({
                                                base: base,
                                                buffer: buffer,
                                                feature: feature,
                                                groups: value.groups,
                                            });
                                        } else if (value.type === 'dwellTime') {
                                            SaveDwellTime.action$.next({
                                                base: base,
                                                buffer: buffer,
                                                feature: feature,
                                                groups: value.groups,
                                                faceId: value.faceId,
                                            });
                                        }
                                    } catch (e) {
                                        Print.Log(e, new Error(), 'error');
                                    } finally {
                                        buffer = null;
                                    }
                                }),
                            );
                        } catch (e) {
                            Print.Log(e, new Error(), 'error');
                        }

                        next$.next();
                    },
                });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }
}
export default new Action();

namespace Action {
    /**
     *
     */
    export interface IDemo {
        objectId: string;
        name: string;
        demo: Demographic.ISap;
    }

    /**
     *
     */
    export type IAction = IAction_Demographic | IAction_RepeatVisitor | IAction_DwellTime;

    /**
     *
     */
    export interface IAction_Base {
        device: IDB.Device;
        date: Date;
        imagePath: string;
    }

    /**
     *
     */
    export interface IAction_Demographic extends IAction_Base {
        type: 'demographic';
        groups: Enum.EPeopleType[];
    }

    export interface IAction_RepeatVisitor extends IAction_Base {
        type: 'repeatVisitor';
        faceId: string;
    }

    export interface IAction_DwellTime extends IAction_Base {
        type: 'dwellTime';
        groups: Enum.EPeopleType[];
        faceId: string;
    }
}

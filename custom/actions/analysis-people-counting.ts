import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, File } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';
import { DeleteFile, SavePeopleCountingMerge, SavePeopleCountingSeparation } from './';

class Action {
    /**
     *
     */
    private _initialization$: Rx.Subject<{}> = new Rx.Subject();

    /**
     *
     */
    private _config = Config.devicePeopleCounting;

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
            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
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

                                        let base: IDB.IReportBase = {
                                            site: site,
                                            area: area,
                                            device: device,
                                            date: value.date,
                                        };

                                        if (value.type === 'merge') {
                                            SavePeopleCountingMerge.action$.next({
                                                base: base,
                                                count: {
                                                    in: value.in,
                                                    out: value.out,
                                                },
                                            });
                                        } else if (value.type === 'separation') {
                                            buffer = File.ReadFile(value.imagePath);
                                            DeleteFile.action$.next(value.imagePath);

                                            SavePeopleCountingSeparation.action$.next({
                                                base: base,
                                                buffer: buffer,
                                                isEmployee: value.isEmployee,
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
    export type IAction = IAction_Merge | IAction_Separation;

    /**
     *
     */
    export interface IAction_Base {
        device: IDB.Device;
        date: Date;
    }

    /**
     *
     */
    export interface IAction_Merge extends IAction_Base {
        type: 'merge';
        in: number;
        out: number;
    }

    /**
     *
     */
    export interface IAction_Separation extends IAction_Base {
        type: 'separation';
        imagePath: string;
        isEmployee: boolean;
    }
}

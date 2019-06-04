import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Apn, Fcm } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';

class Action {
    private _config = Config.pushNotification;

    private _action$: Rx.Subject<Action.IAction> = new Rx.Subject();
    public get action$(): Rx.Subject<Action.IAction> {
        return this._action$;
    }

    constructor() {
        Main.ready$.subscribe({
            next: async () => {
                await this.Initialization();
            },
        });
    }

    private Initialization = async (): Promise<void> => {
        try {
            let fcm: Fcm = new Fcm(this._config.fcm);
            let apn: Apn = new Apn({
                ...this._config.apn,
                production: !process.env.NODE_ENV || process.env.NODE_ENV !== 'development',
            });

            let next$: Rx.Subject<{}> = new Rx.Subject();

            this._action$
                .buffer(this._action$.bufferCount(this._config.bufferCount).merge(Rx.Observable.interval(1000)))
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        if (x.length !== 0 && !this._config.enable) {
                            Print.Log(`Push notification was disabled`, new Error(), 'warning');
                        } else {
                            await Promise.all(
                                x.map(async (value, index, array) => {
                                    if (value.to.mobileType === Enum.EMobileType.android) {
                                        try {
                                            let result: string = await fcm.Send(value.to.mobileToken, value.title, value.message);

                                            Print.Log(`Fcm: ${value.to.name} -> success`, new Error(), 'success');
                                        } catch (e) {
                                            Print.Log(`Fcm: ${value.to.name} -> ${e}`, new Error(), 'error');
                                        }
                                    } else {
                                        try {
                                            let result = await apn.Send(value.to.mobileToken, value.title, value.message);

                                            Print.Log(`Apn: ${value.to.name} -> success`, new Error(), 'success');
                                        } catch (e) {
                                            Print.Log(`Apn: ${value.to.name} -> ${e}`, new Error(), 'error');
                                        }
                                    }
                                }),
                            );
                        }

                        next$.next();
                    },
                });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    };
}
export default new Action();

namespace Action {
    export interface ITo {
        name: string;
        mobileType: Enum.EMobileType;
        mobileToken: string;
    }

    export interface IAction {
        to: ITo;
        title: string;
        message: string;
    }
}

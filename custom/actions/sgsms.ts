import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Regex, Sgsms } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';

class Action {
    private _config = Config.sgSms;

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
            let sgsms: Sgsms = new Sgsms();
            sgsms.config = {
                url: this._config.url,
                account: this._config.account,
                password: this._config.password,
            };

            sgsms.Initialization();

            let next$: Rx.Subject<{}> = new Rx.Subject();

            this._action$
                .buffer(this._action$.bufferCount(this._config.bufferCount).merge(Rx.Observable.interval(1000)))
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .map((x) => {
                    return x.filter((value, index, array) => {
                        return value.to.phone && Regex.IsInternationalPhone(value.to.phone);
                    });
                })
                .subscribe({
                    next: async (x) => {
                        if (x.length !== 0 && !this._config.enable) {
                            Print.Log(`Sgsms was disabled`, new Error(), 'warning');
                        } else {
                            await Promise.all(
                                x.map(async (value, index, array) => {
                                    try {
                                        let result: string = await sgsms.Send(value.title, value.message, value.to.phone);

                                        Print.Log(`Sgsms: ${value.to.name} -> success`, new Error(), 'success');
                                    } catch (e) {
                                        Print.Log(`Sgsms: ${value.to.name} -> fail`, new Error(), 'error');
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
        phone: string;
    }

    export interface IAction {
        to: ITo;
        title: string;
        message: string;
    }
}

import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Regex, Email } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';

class Action {
    private _config = Config.email;

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
            let email: Email = new Email();
            email.config = {
                host: this._config.host,
                port: this._config.port,
                email: this._config.email,
                password: this._config.password,
            };

            email.Initialization();

            let next$: Rx.Subject<{}> = new Rx.Subject();

            this._action$
                .buffer(this._action$.bufferCount(this._config.bufferCount).merge(Rx.Observable.interval(1000)))
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .map((x) => {
                    return x.map((value, index, array) => {
                        return {
                            ...value,
                            tos: value.tos.filter((value1, index1, array1) => {
                                return value1.email && Regex.IsEmail(value1.email);
                            }),
                        };
                    });
                })
                .subscribe({
                    next: async (x) => {
                        if (x.length !== 0 && !this._config.enable) {
                            Print.Log(`Email was disabled`, new Error(), 'warning');
                        } else {
                            await Promise.all(
                                x.map(async (value, index, array) => {
                                    try {
                                        let result = await email.Send(value.title, value.message, {
                                            tos: value.tos.map((x) => x.email),
                                        });

                                        value.tos.forEach((value, index, array) => {
                                            Print.Log(`Email: ${value.name} -> success`, new Error(), 'success');
                                        });
                                    } catch (e) {
                                        value.tos.forEach((value, index, array) => {
                                            Print.Log(`Email: ${value.name} -> fail`, new Error(), 'error');
                                        });
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
        email: string;
    }

    export interface IAction {
        tos: ITo[];
        title: string;
        message: string;
    }
}

import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Regex, Email } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';
import { default as DataCenter } from '../services/data-center';

class Action {
    /**
     *
     */
    private _config = Config.email;

    /**
     *
     */
    private _enable: boolean = false;

    /**
     *
     */
    private _email: Email = undefined;

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
        DataCenter.emailSetting$
            .filter((x) => !!x)
            .subscribe({
                next: (x) => {
                    try {
                        this._email = new Email();
                        this._email.config = {
                            host: x.host,
                            port: x.port,
                            email: x.email,
                            password: x.password,
                        };

                        this._email.Initialization();

                        this._enable = x.enable;
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
                },
            });

        Main.ready$.subscribe({
            next: async () => {
                await this.Initialization();
            },
        });
    }

    /**
     * Initialization
     */
    private async Initialization(): Promise<void> {
        try {
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
                        if (x.length !== 0 && !this._enable) {
                            Print.Log(`Email was disabled`, new Error(), 'warning');
                        } else {
                            await Promise.all(
                                x.map(async (value, index, array) => {
                                    try {
                                        let result = await this._email.Send(
                                            value.title,
                                            value.message,
                                            {
                                                tos: value.tos.map((x) => x.email),
                                            },
                                            value.attachments,
                                        );

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
    }
}
export default new Action();

namespace Action {
    export interface ITo {
        name: string;
        email: string;
    }

    export interface IAction {
        tos: ITo[];
        ccs?: ITo[];
        title: string;
        message: string;
        attachments?: Email.Attachment[];
    }
}

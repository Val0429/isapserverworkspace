import { Config } from 'core/config.gen';
import { ScheduleActionEmail, ScheduleActionEmailResult } from 'core/scheduler-loader';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print } from '../helpers';
import * as Enum from '../enums';

class Action {
    private _bufferCount: number = 10;

    private _action$: Rx.Subject<Action.IActionData> = new Rx.Subject();
    public get action$(): Rx.Subject<Action.IActionData> {
        return this._action$;
    }

    private _smtp$: Rx.Subject<Action.ISmtpData> = new Rx.Subject();
    public get smtp$(): Rx.Subject<Action.ISmtpData> {
        return this._smtp$;
    }

    constructor() {
        setTimeout(async () => {
            await this.Initialization();
        }, 0);
    }

    private Initialization = async (): Promise<void> => {
        try {
            let next$: Rx.Subject<{}> = new Rx.Subject();

            this._smtp$
                .buffer(this._smtp$.bufferCount(this._bufferCount).merge(Rx.Observable.interval(1000)))
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        // if (x.length > 0) Print.Log(`${JSON.stringify(x)}`, new Error(), 'message');

                        await Promise.all(
                            x.map(async (value, index, array) => {
                                try {
                                    let title: string = 'Occupancy Alert';
                                    let message: string = `${value.areaName} Occupancy Count at ${value.count}.`;

                                    let tos: Action.ITo[] = value.userInfos
                                        .map((value1, index1, array1) => {
                                            if (!value1.getValue('email')) {
                                                Print.Log(`${value1.getValue('name')} email address not found`, new Error(), 'error');
                                            }

                                            return {
                                                name: value1.getValue('name'),
                                                email: value1.getValue('email'),
                                            };
                                        })
                                        .filter((value1, index1, array1) => {
                                            return value1.email;
                                        });

                                    let result = await new ScheduleActionEmail().do({
                                        to: tos.map((x) => x.email),
                                        subject: title,
                                        body: message,
                                    });

                                    switch (result) {
                                        case ScheduleActionEmailResult.Disabled:
                                            tos.forEach((value1, index1, array1) => {
                                                Print.Log(`${value1.email} email was disabled`, new Error(), 'warning');
                                            });
                                            break;
                                        case ScheduleActionEmailResult.Failed:
                                            tos.forEach((value1, index1, array1) => {
                                                Print.Log(`${value1.email} email send failed`, new Error(), 'error');
                                            });
                                            break;
                                        case ScheduleActionEmailResult.Success:
                                            tos.forEach((value1, index1, array1) => {
                                                Print.Log(`${value1.email} email send success`, new Error(), 'success');
                                            });
                                            break;
                                    }
                                } catch (e) {
                                    Print.Log(e, new Error(), 'error');
                                }
                            }),
                        );

                        next$.next();
                    },
                });

            this._action$.subscribe({
                next: async (x) => {
                    try {
                        if (!x.rules) {
                            return;
                        }

                        let prevRange = x.rules.find((value, index, array) => {
                            return value.triggerMax >= x.prev && value.triggerMin <= x.prev;
                        });
                        let currRange = x.rules.find((value, index, array) => {
                            return value.triggerMax >= x.curr && value.triggerMin <= x.curr;
                        });

                        // Print.Log(`Prev: ${x.prev}(${JSON.stringify(prevRange)}), Curr: ${x.curr}(${JSON.stringify(currRange)})`, new Error(), 'info');

                        if (JSON.stringify(currRange) !== JSON.stringify(prevRange)) {
                            if (currRange) {
                                let users: Parse.User[] = currRange.userIds.map((value, index, array) => {
                                    let user: Parse.User = new Parse.User();
                                    user.id = value;

                                    return user;
                                });
                                let userInfos: IDB.UserInfo[] = await new Parse.Query(IDB.UserInfo)
                                    .containedIn('user', users)
                                    .equalTo('isDeleted', false)
                                    .find()
                                    .fail((e) => {
                                        throw e;
                                    });

                                this._smtp$.next({
                                    userInfos: userInfos,
                                    areaName: x.areaName,
                                    count: x.curr,
                                });
                            }
                        }
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
                },
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    };
}
export default new Action();

namespace Action {
    export interface IActionData {
        areaName: string;
        rules: IDB.IActionSmtp[];
        prev: number;
        curr: number;
    }

    export interface ISmtpData {
        userInfos: IDB.UserInfo[];
        areaName: string;
        count: number;
    }

    export interface ITo {
        name: string;
        email: string;
    }
}

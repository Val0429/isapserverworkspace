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
                                        subject: value.title,
                                        body: value.message,
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

                        let rules = x.rules.sort((a, b) => {
                            return a.triggerCount > b.triggerCount ? -1 : 1;
                        });

                        let prevRange = rules.find((value, index, array) => {
                            return value.triggerCount <= x.prev;
                        });
                        let currRange = rules.find((value, index, array) => {
                            return value.triggerCount <= x.curr;
                        });

                        if (JSON.stringify(currRange) !== JSON.stringify(prevRange)) {
                            Print.Log(`Prev: ${x.prev}(${JSON.stringify(prevRange)}) -> Curr: ${x.curr}(${JSON.stringify(currRange)})`, new Error(), 'message');

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

                                let mediumCount: number = rules.length >= 2 ? rules[1].triggerCount : rules[0].triggerCount;
                                let highCount: number = rules[0].triggerCount;

                                let level: string = currRange.triggerCount === mediumCount ? 'Medium' : currRange.triggerCount === highCount ? 'High' : 'Low';
                                let title: string = 'Occupancy Alert';
                                let message: string = `${x.areaName} Occupancy Count at ${x.curr}. ${level} threshold exceeded.`;

                                this._smtp$.next({
                                    userInfos: userInfos,
                                    title: title,
                                    message: message,
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
        title: string;
        message: string;
    }

    export interface ITo {
        name: string;
        email: string;
    }
}
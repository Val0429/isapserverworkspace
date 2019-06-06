import { Config } from 'core/config.gen';
import { ScheduleActionSGSMS, ScheduleActionSMSResult } from 'core/scheduler-loader';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';

class Action {
    private _bufferCount: number = 10;

    private _action$: Rx.Subject<Action.IActionData> = new Rx.Subject();
    public get action$(): Rx.Subject<Action.IActionData> {
        return this._action$;
    }

    private _sgsms$: Rx.Subject<Action.ISgsmsData> = new Rx.Subject();
    public get sgsms$(): Rx.Subject<Action.ISgsmsData> {
        return this._sgsms$;
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
            let next$: Rx.Subject<{}> = new Rx.Subject();

            this._sgsms$
                .buffer(this._sgsms$.bufferCount(this._bufferCount).merge(Rx.Observable.interval(1000)))
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
                                    if (value.userInfo.getValue('phone')) {
                                        let result = await new ScheduleActionSGSMS().do({
                                            phone: value.userInfo.getValue('phone'),
                                            from: value.title,
                                            message: value.message,
                                            username: Config.sgsms.username,
                                            password: Config.sgsms.password,
                                        });

                                        switch (result) {
                                            case ScheduleActionSMSResult.Disabled:
                                                Print.Log(`${value.userInfo.getValue('name')} sgsms was disabled`, new Error(), 'warning');
                                                break;
                                            case ScheduleActionSMSResult.Failed:
                                                Print.Log(`${value.userInfo.getValue('name')} sgsms send failed`, new Error(), 'error');
                                                break;
                                            case ScheduleActionSMSResult.Success:
                                                Print.Log(`${value.userInfo.getValue('name')} sgsms send success`, new Error(), 'success');
                                                break;
                                        }
                                    } else {
                                        Print.Log(`${value.userInfo.getValue('name')} phone number not found`, new Error(), 'error');
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

                                userInfos.forEach((value, index, array) => {
                                    this._sgsms$.next({
                                        userInfo: value,
                                        title: title,
                                        message: message,
                                    });
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
        rules: IDB.IActionSgsms[];
        prev: number;
        curr: number;
    }

    export interface ISgsmsData {
        userInfo: IDB.UserInfo;
        title: string;
        message: string;
    }
}

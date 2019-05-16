import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Apn, Fcm } from '../helpers';
import * as Enum from '../enums';

class Action {
    private _bufferCount: number = Config.pushnotification.bufferCount;

    private _action$: Rx.Subject<Action.IActionData> = new Rx.Subject();
    public get action$(): Rx.Subject<Action.IActionData> {
        return this._action$;
    }

    private _next$: Rx.Subject<{}> = new Rx.Subject();

    constructor() {
        setTimeout(async () => {
            await this.Initialization();
        }, 0);
    }

    private Initialization = async (): Promise<void> => {
        try {
            let fcm: Fcm = new Fcm();
            let apn: Apn = new Apn();

            this._action$
                .buffer(this._action$.bufferCount(this._bufferCount).merge(Rx.Observable.interval(1000)))
                .zip(this._next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        await Promise.all(
                            x.map(async (value, index, array) => {
                                try {
                                    if (value.residentInfo.getValue('isNotice')) {
                                        if (value.residentInfo.getValue('deviceType') === 'android') {
                                            try {
                                                let result: string = await fcm.Send(value.residentInfo.getValue('deviceToken'), value.title, value.body);

                                                Print.Log(`Fcm: ${value.residentInfo.getValue('name')} -> success`, new Error(), 'success');
                                            } catch (e) {
                                                Print.Log(`Fcm: ${value.residentInfo.getValue('name')} -> ${e}`, new Error(), 'error');
                                            }
                                        } else {
                                            try {
                                                let result = await apn.Send(value.residentInfo.getValue('deviceToken'), value.title, value.body);
                                                if (result.failed.length > 0) {
                                                    throw result.failed[0].response.reason;
                                                }

                                                Print.Log(`Apn: ${value.residentInfo.getValue('name')} -> success`, new Error(), 'success');
                                            } catch (e) {
                                                Print.Log(`Apn: ${value.residentInfo.getValue('name')} -> ${e}`, new Error(), 'error');
                                            }
                                        }
                                    }
                                } catch (e) {
                                    Print.Log(e, new Error(), 'error');
                                }
                            }),
                        );

                        this._next$.next();
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
        residentInfo: IDB.CharacterResidentInfo;
        title: string;
        body: string;
    }
}

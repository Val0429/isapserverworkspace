import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print } from '../helpers';
import * as Enum from '../enums';

class Service {
    constructor() {
        setTimeout(async () => {
            await this.Initialization();
        }, 0);
    }

    private Initialization = async (): Promise<void> => {
        try {
            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    };

    private GetDelayTime = (): number => {
        try {
            let now: Date = new Date();
            let target: Date = new Date(new Date(new Date(now).setDate(now.getDate() + 1)).setHours(0, 0, 0, 0));
            let delay: number = target.getTime() - now.getTime();

            return delay;
        } catch (e) {
            throw e;
        }
    };

    private EnableLiveStream = (): void => {
        try {
            let delay: number = this.GetDelayTime();
            Rx.Observable.interval(24 * 60 * 60 * 1000)
                .delay(delay)
                .subscribe({
                    next: async (x) => {
                        try {
                            let now: Date = new Date();
                            if (now.getDate() !== 1) {
                                return;
                            }

                            let residents: IDB.CharacterResident[] = await new Parse.Query(IDB.CharacterResident).find().fail((e) => {
                                throw e;
                            });

                            await Promise.all(
                                residents.map(async (value, index, array) => {
                                    value.setValue('pointBalance', value.getValue('pointTotal'));
                                    value.setValue('pointUpdateDate', now);

                                    await value.save(null, { useMasterKey: true }).fail((e) => {
                                        Print.Log(e, new Error(), 'error');
                                    });
                                }),
                            ).catch((e) => {
                                throw e;
                            });
                        } catch (e) {
                            Print.Log(e, new Error(), 'error');
                        }
                    },
                    error: (e) => {
                        Print.Log(e, new Error(), 'error');
                    },
                    complete: () => {
                        Print.Log('Complete', new Error(), 'success');
                    },
                });
        } catch (e) {
            throw e;
        }
    };
}
export default new Service();

namespace Service {}

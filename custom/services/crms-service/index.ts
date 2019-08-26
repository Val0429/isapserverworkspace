import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { Flow1WorkPermit as WorkPermit } from 'workspace/custom/models/Flow1/crms/work-permit';

class Service {
    /**
     *
     */
    private _config = Config.vms;

    /**
     *
     */
    constructor() {
        this.Initialization();
    }

    /**
     * Initialization
     */
    private async Initialization(): Promise<void> {
        try {
            this.EnableLiveStream();
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * Get delay time
     */
    private GetDelayTime(): number {
        try {
            let now: Date = new Date();
            let target: Date = new Date(new Date(new Date(now).setDate(now.getDate() + 1)).setHours(0, 0, 0, 0));
            let delay: number = target.getTime() - now.getTime();

            return delay;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable live stream
     */
    private async EnableLiveStream(): Promise<void> {
        try {
            let delay = this.GetDelayTime();
            Rx.Observable.interval(24 * 60 * 60 * 1000)
                .startWith(0)
                .delay(delay)
                .subscribe({
                    next: async (x) => {
                        try {
                            let now: Date = new Date();
                            let expired: Date = new Date(new Date(now).setDate(now.getDate() - this._config.workerExpiredDay));

                            let works: WorkPermit[] = await new Parse.Query(WorkPermit)
                                .lessThan('workEndDate', expired)
                                .notEqualTo('persons', [])
                                .find()
                                .fail((e) => {
                                    throw e;
                                });

                            await Promise.all(
                                works.map(async (value, index, array) => {
                                    value.setValue('persons', []);
                                    value.setValue('personNames', []);

                                    await value.save(null, { useMasterKey: true }).fail((e) => {
                                        throw e;
                                    });
                                }),
                            );
                        } catch (e) {
                            console.log(e);
                        }
                    },
                    error: (e) => {
                        console.log(e);
                    },
                    complete: () => {
                        console.log('complete');
                    },
                });
        } catch (e) {
            throw e;
        }
    }
}
export default new Service();

namespace Service {}

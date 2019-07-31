import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, File, DateTime } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';

class Service {
    /**
     *
     */
    private _initialization$: Rx.Subject<{}> = new Rx.Subject();

    /**
     *
     */
    private _config = Config.expired;

    /**
     *
     */
    constructor() {
        let next$: Rx.Subject<{}> = new Rx.Subject();
        this._initialization$
            .debounceTime(1000)
            .zip(next$.startWith(0))
            .subscribe({
                next: async () => {
                    try {
                        await this.Initialization();
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }

                    next$.next();
                },
            });

        Main.ready$.subscribe({
            next: async () => {
                this._initialization$.next();
            },
        });
    }

    /**
     * Initialization
     */
    private async Initialization(): Promise<void> {
        try {
            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            this._initialization$.next();
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
            File.DeleteFolderByApp(`${File.assetsPath}/temp`);

            let delay = this.GetDelayTime();
            Rx.Observable.interval(24 * 60 * 60 * 1000)
                .startWith(0)
                .delay(delay)
                .subscribe({
                    next: async (x) => {
                        try {
                            let now: Date = new Date();
                            let path: string = `${File.assetsPath}/images_report`;

                            let expired: Date = new Date(new Date(new Date(now).setDate(now.getDate() - this._config.reportDay)).setHours(0, 0, 0, 0));

                            let folders = File.ReadFolder(path);
                            folders.forEach((value, index, array) => {
                                let folder1s = File.ReadFolder(`${path}/${value}`);
                                folder1s.forEach((value1, index1, array1) => {
                                    try {
                                        let folder = `${path}/${value}/${value1}`;

                                        let date = DateTime.ToDate(value1, 'YYYYMMDD');
                                        if (date.getTime() < expired.getTime()) {
                                            File.DeleteFolderByApp(folder);
                                        }
                                    } catch (e) {
                                        Print.Log(e, new Error(), 'error');
                                    }
                                });
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
    }
}
export default new Service();

namespace Service {}

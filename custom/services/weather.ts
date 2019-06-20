import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Weather } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';

class Service {
    /**
     *
     */
    private _config = Config.darksky;

    /**
     *
     */
    constructor() {
        Main.ready$.subscribe({
            next: async () => {
                try {
                    await this.Initialization();
                } catch (e) {
                    Print.Log(e, new Error(), 'error');
                }
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
        }
    }

    /**
     * Get delay time
     */
    private GetDelayTime(): number {
        try {
            let now: Date = new Date();
            let target: Date = new Date(new Date(new Date(now).setHours(Math.ceil(now.getHours() / this._config.hourlyFrequency) * this._config.hourlyFrequency)).setMinutes(0, 0, 0));
            let delay: number = target.getTime() - now.getTime();

            return delay;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable live stream
     */
    private EnableLiveStream(): void {
        try {
            let darksky: Weather.Darksky = new Weather.Darksky();
            darksky.secretKey = this._config.secretKey;

            darksky.Initialization();

            let next$: Rx.Subject<{}> = new Rx.Subject();
            let queue$: Rx.Subject<Service.IQueue> = new Rx.Subject();
            queue$
                .buffer(queue$.bufferCount(this._config.bufferCount).merge(Rx.Observable.interval(1000)))
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        try {
                            await Promise.all(
                                x.map(async (value, index, array) => {
                                    try {
                                        let daily = await darksky.GetDay(value.site.getValue('latitude'), value.site.getValue('longitude'));

                                        let weather: IDB.Weather = new IDB.Weather();

                                        weather.setValue('site', value.site);
                                        weather.setValue('date', value.date);
                                        weather.setValue('icon', daily.daily.icon);
                                        weather.setValue('temperatureMin', daily.daily.temperatureMin);
                                        weather.setValue('temperatureMax', daily.daily.temperatureMax);

                                        await weather.save(null, { useMasterKey: true }).fail((e) => {
                                            throw e;
                                        });
                                    } catch (e) {
                                        Print.Log(e, new Error(), 'error');
                                    }
                                }),
                            ).catch((e) => {
                                throw e;
                            });
                        } catch (e) {
                            Print.Log(e, new Error(), 'error');
                        }

                        next$.next();
                    },
                });

            let delay: number = this.GetDelayTime();
            Rx.Observable.interval(24 * 60 * 60 * 1000)
            Rx.Observable.interval(this._config.hourlyFrequency * 60 * 60 * 1000)
                .startWith(0)
                .delay(delay)
                .subscribe({
                    next: async (x) => {
                        try {
                            let date: Date = new Date();
                            date = new Date(date.setHours(0, 0, 0, 0));

                            let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite).find().fail((e) => {
                                throw e;
                            });

                            sites.forEach((value, index, array) => {
                                queue$.next({
                                    date: date,
                                    site: value,
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

namespace Service {
    /**
     *
     */
    export interface IQueue {
        date: Date;
        site: IDB.LocationSite;
    }
}

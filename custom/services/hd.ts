import { Config } from 'core/config.gen';
import { Print, HumanDetection, Yolo3, ISapHD, File, Cms, Draw, Utility, DateTime } from '../helpers';
import * as Rx from 'rxjs';
import { IHumans, Humans, IHumansSummary, HumansSummary } from '../models';
import { pulling$ } from '../../cgi-bin/occupancy';

(async function() {
    let save$: Rx.Subject<IHumans> = SaveQueue();

    CMS(save$);
})();

/**
 *
 */
function SaveQueue(): Rx.Subject<IHumans> {
    let save$: Rx.Subject<IHumans> = new Rx.Subject();
    let next$: Rx.Subject<{}> = new Rx.Subject();

    save$
        .zip(next$.startWith(0))
        .map((x) => {
            return x[0];
        })
        .subscribe({
            next: async (x) => {
                await Save(x);
                next$.next();
            },
        });

    return save$;
}

/**
 *
 */
function CMS(save$: Rx.Subject<IHumans>): void {
    let hd$: Rx.Subject<Date> = new Rx.Subject<Date>();

    let success$: Rx.Subject<{}> = new Rx.Subject();
    let next$: Rx.Subject<{}> = new Rx.Subject();

    let cameraCount: number = [].concat(
        ...Config.humanDetection.cameraSources.map((value, index, array) => {
            return value.channel;
        }),
    ).length;

    Config.humanDetection.cameraSources.forEach((value1, index1, array1) => {
        value1.channel.forEach((value2, index2, array2) => {
            hd$.subscribe({
                next: async (now: Date) => {
                    try {
                        let snapshot = await Cms.GetSnapshot(Config.cms, value1.nvr, value2);

                        let path: string = `${File.assetsPath}/${Config.humanDetection.output.path}`;
                        File.CreateFolder(path);

                        let camera: string = `Camera_${Utility.PadLeft(value1.nvr.toString(), '0', 2)}_${Utility.PadLeft(value2.toString(), '0', 2)}`;

                        let humans: IHumans = {
                            analyst: '',
                            source: 'cms',
                            camera: camera,
                            score: 0,
                            src: '',
                            locations: [],
                            date: now,
                        };

                        let tasks: Promise<any>[] = [];

                        if (Config.humanDetection.yolo.isEnable) {
                            let filename: string = `Yolo3_${camera}_${now.getTime()}.png`;
                            tasks.push(YoloAnalysis(save$, snapshot.buffer, path, filename, humans));
                        }

                        if (Config.humanDetection.isap.isEnable) {
                            let filename: string = `ISap_${camera}_${now.getTime()}.png`;
                            tasks.push(ISapAnalysis(save$, snapshot.buffer, path, filename, humans));
                        }

                        await Promise.all(tasks).catch((e) => {
                            throw e;
                        });

                        success$.next();
                    } catch (e) {
                        Print.MinLog(e, 'error');
                    }
                },
            });
        });
    });

    success$.bufferCount(cameraCount).subscribe({
        next: () => {
            pulling$.next();
            next$.next();
        },
    });

    let now: Date = new Date();
    let target: Date = new Date(new Date(new Date(now).setMinutes(Math.ceil((now.getMinutes() + 1) / 5) * 5)).setSeconds(0, 0));
    let delay: number = target.getTime() - now.getTime();

    setTimeout(() => {
        Rx.Observable.interval(Config.humanDetection.intervalSecond * 1000)
            .startWith(0)
            .zip(next$.startWith(0))
            .subscribe({
                next: (x) => {
                    let now: Date = new Date(new Date().setSeconds(0, 0));
                    hd$.next(now);
                },
            });
    }, delay);
}

/**
 *
 * @param buffer
 * @param path
 * @param filename
 * @param humans
 */
async function YoloAnalysis(save$: Rx.Subject<IHumans>, buffer: Buffer, path: string, filename: string, humans?: IHumans): Promise<HumanDetection.ILocation[]> {
    try {
        File.WriteFile(`${path}/${filename}`, buffer);

        let yolo3: Yolo3 = new Yolo3();
        yolo3.path = Config.humanDetection.yolo.path;
        yolo3.filename = Config.humanDetection.yolo.filename;
        yolo3.score = Config.humanDetection.yolo.target_score;

        yolo3.Initialization();

        let result: HumanDetection.ILocation[] = await yolo3.Analysis(`${path}/${filename}`);

        if (humans !== null && humans !== undefined) {
            humans.analyst = 'Yolo3';
            humans.score = yolo3.score;
            humans.src = filename;
            humans.locations = result;

            save$.next(humans);
        }

        buffer = await SaveImage(buffer, result);
        File.WriteFile(`${path}/${filename}`, buffer);

        return result;
    } catch (e) {
        throw e;
    }
}

/**
 *
 * @param buffer
 * @param path
 * @param filename
 * @param humans
 */
async function ISapAnalysis(save$: Rx.Subject<IHumans>, buffer: Buffer, path: string, filename: string, humans?: IHumans): Promise<HumanDetection.ILocation[]> {
    try {
        let isapHD: ISapHD = new ISapHD();
        isapHD.ip = Config.humanDetection.isap.ip;
        isapHD.port = Config.humanDetection.isap.port;
        isapHD.score = Config.humanDetection.isap.target_score;

        isapHD.Initialization();

        let result: HumanDetection.ILocation[] = await isapHD.Analysis(buffer);

        if (humans !== null && humans !== undefined) {
            humans.analyst = 'ISap';
            humans.score = isapHD.score;
            humans.src = filename;
            humans.locations = result;

            save$.next(humans);
        }

        buffer = await SaveImage(buffer, result);
        File.WriteFile(`${path}/${filename}`, buffer);

        return result;
    } catch (e) {
        throw e;
    }
}

/**
 *
 * @param buffer
 * @param result
 */
async function SaveImage(buffer: Buffer, result: HumanDetection.ILocation[]): Promise<Buffer> {
    try {
        let rects: Draw.IRect[] = result.map((value, index, array) => {
            return {
                x: value.x,
                y: value.y,
                width: value.width,
                height: value.height,
                color: Config.humanDetection.output.color,
                lineWidth: Config.humanDetection.output.lineWidth,
                isFill: Config.humanDetection.output.isFill,
            };
        });

        buffer = await Draw.Rectangle(rects, buffer);
        buffer = await Draw.Resize(
            buffer,
            {
                width: Config.humanDetection.output.width,
                height: Config.humanDetection.output.height,
            },
            Config.humanDetection.output.quality,
        );

        return buffer;
    } catch (e) {
        throw e;
    }
}

/**
 *
 * @param _humans
 */
async function Save(_humans: IHumans): Promise<void> {
    try {
        let tasks: Promise<any>[] = [];

        tasks.push(SaveHumans(_humans));
        tasks.push(SaveHumansSummary(_humans, 'month'));
        tasks.push(SaveHumansSummary(_humans, 'day'));
        tasks.push(SaveHumansSummary(_humans, 'hour'));

        await Promise.all(tasks).catch((e) => {
            throw e;
        });
    } catch (e) {
        throw e;
    }
}

/**
 *
 * @param _humans
 */
async function SaveHumans(_humans: IHumans): Promise<void> {
    try {
        let humans: Humans = new Humans();
        await humans.save(_humans, { useMasterKey: true }).catch((e) => {
            throw e;
        });
    } catch (e) {
        throw e;
    }
}

/**
 *
 * @param _humans
 * @param type
 */
async function SaveHumansSummary(_humans: IHumans, type: 'month' | 'day' | 'hour'): Promise<void> {
    try {
        let date: Date = new Date(_humans.date);
        if (type === 'month') {
            date = new Date(new Date(date.setDate(1)).setHours(0, 0, 0, 0));
        } else if (type === 'day') {
            date = new Date(date.setHours(0, 0, 0, 0));
        } else if (type === 'hour') {
            date = new Date(date.setMinutes(0, 0, 0));
        }

        let humansSummary: HumansSummary = await new Parse.Query(HumansSummary)
            .equalTo('analyst', _humans.analyst)
            .equalTo('source', _humans.source)
            .equalTo('camera', _humans.camera)
            .equalTo('type', type)
            .equalTo('date', date)
            .first()
            .catch((e) => {
                throw e;
            });

        if (humansSummary === null || humansSummary === undefined) {
            let _humansSummary: IHumansSummary = {
                analyst: _humans.analyst,
                source: _humans.source,
                camera: _humans.camera,
                type: type,
                date: date,
                total: _humans.locations.length,
            };

            humansSummary = new HumansSummary();
            await humansSummary.save(_humansSummary, { useMasterKey: true }).catch((e) => {
                throw e;
            });
        } else {
            humansSummary.setValue('total', humansSummary.getValue('total') + _humans.locations.length);

            await humansSummary.save(null, { useMasterKey: true }).catch((e) => {
                throw e;
            });
        }
    } catch (e) {
        throw e;
    }
}

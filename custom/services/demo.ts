import { Config } from 'core/config.gen';
import { Print, Cms, Face, Draw, File, Utility, ISapDemo, FRSService, FRSCore, Parser } from '../helpers';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { pulling$ } from '../../cgi-bin/faceCount';

(async function() {
    let save$: Rx.Subject<IDB.IHuman> = SaveQueue();

    if (Config.demographic.source === 'cms') {
        CMS(save$);
    } else {
        FRS(save$);
    }
})();

/**
 *
 */
function SaveQueue(): Rx.Subject<IDB.IHuman> {
    let save$: Rx.Subject<IDB.IHuman> = new Rx.Subject();
    let next$: Rx.Subject<{}> = new Rx.Subject();

    save$
        .zip(next$.startWith(0))
        .map((x) => {
            return x[0];
        })
        .subscribe({
            next: async (x) => {
                await Save(x);
                pulling$.next();
                next$.next();
            },
        });

    return save$;
}

/**
 *
 */
function CMS(save$: Rx.Subject<IDB.IHuman>): void {
    let demo$: Rx.Subject<Date> = new Rx.Subject<Date>();

    let success$: Rx.Subject<{}> = new Rx.Subject();
    let next$: Rx.Subject<{}> = new Rx.Subject();

    let cameraCount: number = [].concat(
        ...Config.demographic.cameraSources.map((value, index, array) => {
            return value.channel;
        }),
    ).length;

    Config.demographic.cameraSources.forEach((value1, index1, array1) => {
        value1.channel.forEach((value2, index2, array2) => {
            demo$.subscribe({
                next: async (now: Date) => {
                    try {
                        let snapshot = await Cms.GetSnapshot(Config.cms, value1.nvr, value2).catch((e) => {
                            throw e;
                        });

                        let path: string = `${File.assetsPath}/${Config.demographic.output.path}`;
                        File.CreateFolder(path);

                        let faces: Draw.ILocation[] = await Face.Detect(snapshot.buffer).catch((e) => {
                            throw e;
                        });

                        let buffers: Buffer[] = await Draw.CutImage(faces, snapshot.buffer).catch((e) => {
                            throw e;
                        });

                        let camera: string = `Camera_${Utility.PadLeft(value1.nvr.toString(), '0', 2)}_${Utility.PadLeft(value2.toString(), '0', 2)}`;

                        let human: IDB.IHuman = {
                            analyst: '',
                            source: 'cms',
                            camera: camera,
                            faceId: '',
                            name: 'unknown',
                            src: '',
                            date: now,
                            age: 0,
                            gender: '',
                        };

                        let tasks: Promise<any>[] = [];

                        buffers.forEach((buffer, index, array) => {
                            if (Config.demographic.isap.isEnable) {
                                let filename: string = `ISap_${camera}_${now.getTime()}_${index}.png`;
                                tasks.push(ISapAnalysis(save$, buffer, path, filename, human));
                            }
                        });

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
            next$.next();
        },
    });

    Rx.Observable.interval(Config.demographic.intervalSecond * 1000)
        .startWith(0)
        .zip(next$.startWith(0))
        .subscribe({
            next: (x) => {
                let now: Date = new Date(new Date().setMilliseconds(0));
                demo$.next(now);
            },
        });
}

/**
 *
 */
function FRS(save$: Rx.Subject<IDB.IHuman>): void {
    let path: string = `${File.assetsPath}/${Config.demographic.output.path}`;
    File.CreateFolder(path);

    let frs: FRSService = new FRSService({
        frs: Config.frs,
        debug: true,
    });

    frs.start();

    frs.enableLiveFaces(true).catch((e) => {
        throw e;
    });

    frs.sjLiveStream.subscribe(async (face) => {
        let now: Date = new Date(face.timestamp);
        let camera: string = face.channel;
        let faceId: string = face.verify_face_id;
        let name: string = '';

        if (Config.demographic.channels.indexOf(camera) < 0) {
            return;
        }

        let image: string = await frs.snapshot(face).catch((e) => {
            throw e;
        });
        let buffer: Buffer = Buffer.from(image, Parser.Encoding.base64);

        if (face.type === FRSCore.UserType.Recognized) {
            name = face.person_info.fullname;
        } else if (face.type === FRSCore.UserType.UnRecognized) {
            name = 'unknown';
        }

        let human: IDB.IHuman = {
            analyst: '',
            source: 'frs',
            camera: camera,
            faceId: faceId,
            name: name,
            src: '',
            date: now,
            age: 0,
            gender: '',
        };

        let tasks: Promise<any>[] = [];

        if (Config.demographic.isap.isEnable) {
            let filename: string = `ISap_${camera}_${now.getTime()}.png`;

            tasks.push(ISapAnalysis(save$, buffer, path, filename, human));
        }

        await Promise.all(tasks).catch((e) => {
            throw e;
        });
    });
}

/**
 *
 * @param buffer
 * @param path
 * @param filename
 * @param human
 */
async function ISapAnalysis(save$: Rx.Subject<IDB.IHuman>, buffer: Buffer, path: string, filename: string, human?: IDB.IHuman): Promise<ISapDemo.IFeature> {
    let isap: ISapDemo = new ISapDemo();
    isap.ip = Config.demographic.isap.ip;
    isap.port = Config.demographic.isap.port;
    isap.margin = Config.demographic.isap.margin;

    isap.Initialization();

    try {
        let result: ISapDemo.IFeature = await isap.Analysis(buffer).catch((e) => {
            throw e;
        });

        if (human !== null && human !== undefined) {
            human.analyst = 'ISap';
            human.src = filename;
            human.age = result.age;
            human.gender = result.gender;

            save$.next(human);
        }

        buffer = await Draw.Resize2Square(buffer, Config.demographic.output.size);

        File.WriteFile(`${path}/${filename}`, buffer);

        return result;
    } catch (e) {}
}

/**
 *
 * @param _humans
 */
async function Save(_human: IDB.IHuman): Promise<void> {
    try {
        let tasks: Promise<any>[] = [];

        let human: IDB.Human = await SaveHuman(_human);

        tasks.push(SaveHumanSummary(human, _human, 'month'));
        tasks.push(SaveHumanSummary(human, _human, 'day'));
        tasks.push(SaveHumanSummary(human, _human, 'hour'));

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
async function SaveHuman(_human: IDB.IHuman): Promise<IDB.Human> {
    try {
        let human: IDB.Human = new IDB.Human();
        await human.save(_human, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return human;
    } catch (e) {
        throw e;
    }
}

/**
 *
 * @param _humans
 * @param type
 */
async function SaveHumanSummary(human: IDB.Human, _human: IDB.IHuman, type: 'month' | 'day' | 'hour'): Promise<void> {
    try {
        let date: Date = new Date(_human.date);
        if (type === 'month') {
            date = new Date(new Date(date.setDate(1)).setHours(0, 0, 0, 0));
        } else if (type === 'day') {
            date = new Date(date.setHours(0, 0, 0, 0));
        } else if (type === 'hour') {
            date = new Date(date.setMinutes(0, 0, 0));
        }

        let humanSummary: IDB.HumanSummary = await new Parse.Query(IDB.HumanSummary)
            .equalTo('analyst', _human.analyst)
            .equalTo('source', _human.source)
            .equalTo('camera', _human.camera)
            .equalTo('type', type)
            .equalTo('date', date)
            .first()
            .catch((e) => {
                throw e;
            });

        if (humanSummary === null || humanSummary === undefined) {
            let _humanSummary: IDB.IHumanSummary = {
                analyst: _human.analyst,
                source: _human.source,
                camera: _human.camera,
                type: type,
                date: date,
                total: 1,
                male: _human.gender === 'male' ? 1 : 0,
                humans: [human],
            };

            humanSummary = new IDB.HumanSummary();
            await humanSummary.save(_humanSummary, { useMasterKey: true }).catch((e) => {
                throw e;
            });
        } else {
            humanSummary.setValue('total', humanSummary.getValue('total') + 1);
            humanSummary.setValue('male', humanSummary.getValue('male') + (_human.gender === 'male' ? 1 : 0));
            humanSummary.setValue('humans', humanSummary.getValue('humans').concat(human));

            await humanSummary.save(null, { useMasterKey: true }).catch((e) => {
                throw e;
            });
        }
    } catch (e) {
        throw e;
    }
}

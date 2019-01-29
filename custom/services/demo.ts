import { Config } from 'core/config.gen';
import { Print, Cms, Face, Draw, File, Utility, ISapDemo, FRSService, FRSCore, Parser } from '../helpers';
import * as Rx from 'rxjs';
import { IHuman, Human } from '../models';

(async function() {
    if (Config.demographic.source === 'cms') {
        CMS();
    } else {
        FRS();
    }
})();

function CMS(): void {
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

                        let human: IHuman = {
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
                                tasks.push(ISapAnalysis(buffer, path, filename, human));
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

function FRS(): void {
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

        let image: string = await frs.snapshot(face).catch((e) => {
            throw e;
        });
        let buffer: Buffer = Buffer.from(image, Parser.Encoding.base64);

        if (face.type === FRSCore.UserType.Recognized) {
            name = face.person_info.fullname;
        } else if (face.type === FRSCore.UserType.UnRecognized) {
            name = 'unknown';
        }

        let human: IHuman = {
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

            tasks.push(ISapAnalysis(buffer, path, filename, human));
        }

        await Promise.all(tasks).catch((e) => {
            throw e;
        });
    });
}

async function ISapAnalysis(buffer: Buffer, path: string, filename: string, _human?: IHuman): Promise<ISapDemo.IFeature> {
    let isap: ISapDemo = new ISapDemo();
    isap.ip = Config.demographic.isap.ip;
    isap.port = Config.demographic.isap.port;
    isap.margin = Config.demographic.isap.margin;

    isap.Initialization();

    try {
        let result: ISapDemo.IFeature = await isap.Analysis(buffer).catch((e) => {
            throw e;
        });

        if (_human !== null && _human !== undefined) {
            _human.analyst = 'ISap';
            _human.src = filename;
            _human.age = result.age;
            _human.gender = result.gender.toLowerCase();

            let human: Human = new Human();
            await human.save(_human, { useMasterKey: true }).catch((e) => {
                throw e;
            });
        }

        File.WriteFile(`${path}/${filename}`, buffer);

        return result;
    } catch (e) {}
}

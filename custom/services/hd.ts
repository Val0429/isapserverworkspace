import { Config } from 'core/config.gen';
import { Print, HumanDetection, Yolo3, ISapHD, File, Cms, Draw, Utility } from '../helpers';
import * as Rx from 'rxjs';
import { IHumans, Humans } from '../models';
import { pulling$ } from '../../cgi-bin/occupancy/chart';

(async function() {
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
                        let snapshot = await Cms.GetSnapshot(Config.cms, value1.nvr, value2).catch((e) => {
                            throw e;
                        });

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
                            tasks.push(YoloAnalysis(snapshot.buffer, path, filename, humans));
                        }

                        if (Config.humanDetection.isap.isEnable) {
                            let filename: string = `ISap_${camera}_${now.getTime()}.png`;
                            tasks.push(ISapAnalysis(snapshot.buffer, path, filename, humans));
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

    Rx.Observable.interval(Config.humanDetection.intervalSecond * 1000)
        .startWith(0)
        .zip(next$.startWith(0))
        .subscribe({
            next: (x) => {
                let now: Date = new Date(new Date().setMilliseconds(0));
                hd$.next(now);
            },
        });
})();

async function YoloAnalysis(buffer: Buffer, path: string, filename: string, _humanDetection?: IHumans): Promise<HumanDetection.ILocation[]> {
    File.WriteFile(`${path}/${filename}`, buffer);

    let yolo3: Yolo3 = new Yolo3();
    yolo3.path = Config.humanDetection.yolo.path;
    yolo3.filename = Config.humanDetection.yolo.filename;
    yolo3.score = Config.humanDetection.yolo.target_score;

    yolo3.Initialization();

    let result: HumanDetection.ILocation[] = await yolo3.Analysis(`${path}/${filename}`).catch((e) => {
        throw e;
    });

    if (_humanDetection !== null && _humanDetection !== undefined) {
        _humanDetection.analyst = 'Yolo3';
        _humanDetection.score = yolo3.score;
        _humanDetection.src = filename;
        _humanDetection.locations = result;

        let humanDetection: Humans = new Humans();
        await humanDetection.save(_humanDetection, { useMasterKey: true }).catch((e) => {
            throw e;
        });
    }

    buffer = await SaveImage(buffer, result).catch((e) => {
        throw e;
    });
    File.WriteFile(`${path}/${filename}`, buffer);

    return result;
}

async function ISapAnalysis(buffer: Buffer, path: string, filename: string, _humanDetection?: IHumans): Promise<HumanDetection.ILocation[]> {
    let isapHD: ISapHD = new ISapHD();
    isapHD.ip = Config.humanDetection.isap.ip;
    isapHD.port = Config.humanDetection.isap.port;
    isapHD.score = Config.humanDetection.isap.target_score;

    isapHD.Initialization();

    let result: HumanDetection.ILocation[] = await isapHD.Analysis(buffer).catch((e) => {
        throw e;
    });

    if (_humanDetection !== null && _humanDetection !== undefined) {
        _humanDetection.analyst = 'ISap';
        _humanDetection.score = isapHD.score;
        _humanDetection.src = filename;
        _humanDetection.locations = result;

        let humanDetection: Humans = new Humans();
        await humanDetection.save(_humanDetection, { useMasterKey: true }).catch((e) => {
            throw e;
        });
    }

    buffer = await SaveImage(buffer, result).catch((e) => {
        throw e;
    });
    File.WriteFile(`${path}/${filename}`, buffer);

    return result;
}

async function SaveImage(buffer: Buffer, result: HumanDetection.ILocation[]): Promise<Buffer> {
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

    buffer = await Draw.Rectangle(rects, buffer).catch((e) => {
        throw e;
    });
    buffer = await Draw.Resize(
        buffer,
        {
            width: Config.humanDetection.output.width,
            height: Config.humanDetection.output.height,
        },
        Config.humanDetection.output.quality,
    ).catch((e) => {
        throw e;
    });

    return buffer;
}

import { Config } from 'core/config.gen';
import { Print, HumanDetect, Yolo3, ISapHD, File, Cms, Draw } from '../helpers';
import * as Rx from 'rxjs';
import { IHumanDetection, HumanDetection } from '../models';

(async function() {
    let hd: Rx.Subject<{}> = new Rx.Subject();

    Config.humanDetection.cameraSources.forEach((value1, index1, array1) => {
        value1.channel.forEach((value2, index2, array2) => {
            hd.subscribe({
                next: async () => {
                    try {
                        let snapshot = await Cms.GetSnapshot(Config.cms, value1.nvr, value2).catch((e) => {
                            throw e;
                        });

                        let path: string = File.RealPath('./workspace/custom/assets/snapshots');
                        File.CreateFolder(path);

                        let _humanDetection: IHumanDetection = {
                            source: '',
                            nvr: value1.nvr,
                            channel: value2,
                            score: 0,
                            filename: '',
                            locations: [],
                            date: snapshot.date,
                        };

                        let tasks: Promise<any>[] = [];

                        if (Config.humanDetection.yolo.isEnable) {
                            let filename: string = File.RealPath(`${path}/Yolo3_${value1.nvr}_${value2}_${snapshot.date.getTime()}.png`);
                            tasks.push(YoloAnalysis(snapshot.buffer, filename, _humanDetection));
                        }

                        if (Config.humanDetection.isap.isEnable) {
                            let filename: string = File.RealPath(`${path}/ISap_${value1.nvr}_${value2}_${snapshot.date.getTime()}.png`);
                            tasks.push(ISapAnalysis(snapshot.buffer, filename, _humanDetection));
                        }

                        await Promise.all(tasks).catch((e) => {
                            throw e;
                        });
                    } catch (e) {
                        Print.MinLog(e, 'error');
                    }
                },
            });
        });
    });

    Rx.Observable.interval(Config.humanDetection.intervalSecond * 1000)
        .startWith(0)
        .subscribe({
            next: (x) => {
                hd.next();
            },
        });
})();

async function YoloAnalysis(buffer: Buffer, filename: string, _humanDetection?: IHumanDetection): Promise<HumanDetect.ILocation[]> {
    File.WriteFile(filename, buffer);

    let yolo3: Yolo3 = new Yolo3();
    yolo3.path = Config.humanDetection.yolo.path;
    yolo3.filename = Config.humanDetection.yolo.filename;
    yolo3.score = Config.humanDetection.yolo.target_score;

    yolo3.Initialization();

    let result: HumanDetect.ILocation[] = await yolo3.Analysis(filename).catch((e) => {
        throw e;
    });

    if (_humanDetection !== null && _humanDetection !== undefined) {
        _humanDetection.source = 'Yolo3';
        _humanDetection.score = yolo3.score;
        _humanDetection.filename = filename;
        _humanDetection.locations = result;

        let humanDetection: HumanDetection = new HumanDetection();
        await humanDetection.save(_humanDetection, { useMasterKey: true }).fail((e) => {
            throw e;
        });
    }

    buffer = await SaveImage(buffer, result);
    File.WriteFile(filename, buffer);

    return result;
}

async function ISapAnalysis(buffer: Buffer, filename: string, _humanDetection?: IHumanDetection): Promise<HumanDetect.ILocation[]> {
    let isapHD: ISapHD = new ISapHD();
    isapHD.ip = Config.humanDetection.isap.ip;
    isapHD.port = Config.humanDetection.isap.port;
    isapHD.score = Config.humanDetection.isap.target_score;

    isapHD.Initialization();

    let result: HumanDetect.ILocation[] = await isapHD.Analysis(buffer).catch((e) => {
        throw e;
    });

    if (_humanDetection !== null && _humanDetection !== undefined) {
        _humanDetection.source = 'ISap';
        _humanDetection.score = isapHD.score;
        _humanDetection.filename = filename;
        _humanDetection.locations = result;

        let humanDetection: HumanDetection = new HumanDetection();
        await humanDetection.save(_humanDetection, { useMasterKey: true }).fail((e) => {
            throw e;
        });
    }

    buffer = await SaveImage(buffer, result);
    File.WriteFile(filename, buffer);

    return result;
}

async function SaveImage(buffer: Buffer, result: HumanDetect.ILocation[]): Promise<Buffer> {
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

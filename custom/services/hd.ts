import { Config } from 'core/config.gen';
import { Print, HumanDetect, Yolo3, ISapHD, DateTime, File, Cms } from '../helpers';
import { Observable, Subject } from 'rxjs';
import { IHumanDetection, HumanDetection } from '../models';

(async function() {
    let hd: Subject<{}> = new Subject();

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

                        let filename: string = File.RealPath(`${path}/${value1.nvr}_${value2}_${snapshot.date.getTime()}.png`);
                        File.SaveFile(filename, snapshot.buffer);

                        let _humanDetection: IHumanDetection = {
                            source: '',
                            nvr: value1.nvr,
                            channel: value2,
                            score: 0,
                            filename: filename,
                            locations: [],
                            date: snapshot.date,
                        };

                        let tasks: Promise<any>[] = [];

                        if (Config.humanDetection.yolo.isEnable) {
                            tasks.push(YoloAnalysis(filename, _humanDetection));
                        }

                        if (Config.humanDetection.isap.isEnable) {
                            tasks.push(ISapAnalysis(snapshot.buffer, _humanDetection));
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

    Observable.interval(Config.humanDetection.intervalSecond * 1000).subscribe({
        next: (x) => {
            hd.next();
        },
    });
})();

async function YoloAnalysis(filename: string, _humanDetection?: IHumanDetection): Promise<void> {
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
        _humanDetection.locations = result;

        let humanDetection: HumanDetection = new HumanDetection();
        await humanDetection.save(_humanDetection, { useMasterKey: true }).fail((e) => {
            throw e;
        });
    }
}

async function ISapAnalysis(buffer: Buffer, _humanDetection?: IHumanDetection): Promise<void> {
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
        _humanDetection.locations = result;

        let humanDetection: HumanDetection = new HumanDetection();
        await humanDetection.save(_humanDetection, { useMasterKey: true }).fail((e) => {
            throw e;
        });
    }
}

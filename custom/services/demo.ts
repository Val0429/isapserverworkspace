import { Config } from 'core/config.gen';
import { Print, HumanDetection, Yolo3, ISapHD, File, Cms, Draw, Parser } from '../helpers';
import * as Rx from 'rxjs';
import FaceDetection from 'services/face-detection';

(async function() {
    let snapshot = await Cms.GetSnapshot(Config.cms, 1, 2).catch((e) => {
        throw e;
    });

    let result: any = await FaceDetection.detect('C:\\Users\\Min.Hsieh\\Desktop\\aa.jpg').catch((e) => {
        throw e;
    });
    console.log(JSON.stringify(result));
})();

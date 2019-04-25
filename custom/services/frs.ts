import { Config } from 'core/config.gen';
import { Print, FRSService, FRSCore, DateTime } from '../helpers';

(async function() {
    try {
        let frs: FRSService = new FRSService({
            frs: Config.frs,
            debug: true,
        });

        frs.start();

        await frs.enableLiveFaces(true).catch((e) => {
            throw e;
        });

        frs.sjLiveStream.subscribe((face) => {
            let timestamp: Date = new Date(face.timestamp);
            let channel: string = face.channel;
            let faceId: string = face.verify_face_id;

            if (face.type === FRSCore.UserType.Recognized) {
                let type: string = 'Recognized';
                let name: string = face.person_info.fullname;

                Print.Log(`${DateTime.DateTime2String(timestamp, DateTime.Format.default)}, ${name}, ${channel}, ${faceId}`, new Error(), 'message');
            } else if (face.type === FRSCore.UserType.UnRecognized) {
                let type: string = 'UnRecognized';
                let name: string = 'undefined';

                Print.Log(`${DateTime.DateTime2String(timestamp, DateTime.Format.default)}, ${name}, ${channel}, ${faceId}`, new Error(), 'message');
            }
        });
    } catch (e) {
        Print.Log(e, new Error(), 'error');
    }
})();

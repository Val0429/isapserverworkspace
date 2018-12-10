import { Response } from '~express/lib/response';
import { FRSService } from './../index';
import * as request from 'request';
import { retry } from 'helpers/utility/retry';
import { RecognizedUser, UnRecognizedUser, RequestLoginReason } from 'workspace/custom/services/frs-service/libs/core';
import { Subject } from 'rxjs';

/**
 * Submodules should take this into consideration:
 * 1) sjLogined
 * 2) sjStarted
 * 3) config.debug
 * 4) when request failed do retry
 * 5) timeout handle
 */

type Base64String = string;
declare module "workspace/custom/services/frs-service" {
    interface FRSService {
        searchFaces(user: RecognizedUser | UnRecognizedUser, starttime: Date, endtime: Date): Subject<RecognizedUser | UnRecognizedUser>;
    }
}

FRSService.prototype.searchFaces = async function(user: RecognizedUser | UnRecognizedUser, starttime: Date, endtime: Date): Subject<RecognizedUser | UnRecognizedUser> {
    let sj = new Subject<RecognizedUser | UnRecognizedUser>();

    (async () => {
        /// 0) extract back timestamp from snapshot
        let snapshot = user.snapshot;
        let regex = /^[^0-9]*([0-9]+)/;
        let timestamp = +snapshot.match(regex)[1];

        /// 1) get back face_feature
        let faceFeature, faceBuffer;
        let backs: any[] = await this.fetchAll(timestamp, timestamp)
            .bufferCount(Number.MAX_SAFE_INTEGER)
            .toPromise();

        /// 1.1) FRS record being deleted. try again within local db.
        if (backs === undefined) {
            backs = await this.localFetchAll(face.timestamp, face.timestamp)
                .bufferCount(Number.MAX_SAFE_INTEGER)
                .toPromise();
        }
        if (backs === undefined) backs = [];

        for (var back of backs) {
            if (snapshot === back.snapshot) {
                faceFeature = back.face_feature;
                break;
            }
        }
        faceBuffer = new Buffer(faceFeature, 'binary');

        /// 2)
        /// 2.1) adjust starttime / endtime with possible companion duration
        let adjustStartTime = starttime - Config.fts.possibleCompanionDurationSeconds*1000;
        let adjustEndTime = endtime + Config.fts.possibleCompanionDurationSeconds*1000;
        this.localFetchAll(adjustStartTime, adjustEndTime, { excludeFaceFeature: face.type === UserType.Recognized ? true : false })
            .pipe( semaphore<RecognizedUser | UnRecognizedUser>(16, async (data) => {
                if (face.type === UserType.UnRecognized && data.type === UserType.UnRecognized) {
                    // //var buffer = new Buffer(data.face_feature, 'binary');
                    let buffer = (data.face_feature as any).buffer;
                     var score = await FaceFeatureCompare.async(faceBuffer, buffer);
                    data.score = score;
                }
                return data;
            }) )
            .pipe( face.type === UserType.Recognized ? searchRecognizedFace(face) : searchUnRecognizedFace(face) )
            .subscribe( async (data) => {
                sj.next(data);

            }, () => {}, async () => {
                sj.complete();
            });

    })();
    
    return sj;    
}

// FRSService.prototype.snapshot = async function(user: RecognizedUser | UnRecognizedUser, resp: Response = null, times = 10): Promise<string> {
//     return retry<string>( async (resolve, reject) => {
//         await this.waitForLogin();
//         let image = user.snapshot;
//         if (!image) throw "RecognizedUser or UnRecognizedUser should provide <snapshot>.";
//         const url: string = this.makeUrl(`snapshot/session_id=${this.sessionId}&image=${image}`);
//         request({ url, method: 'GET', encoding: null }, async (err, res, body) => {
//             if (err || res.statusCode !== 200) {
//                 reject(err || body.toString());
//                 if (res.statusCode === 401) {
//                     this.sjRequestLogin.next(RequestLoginReason.SessionExpired);
//                     await this.waitForLogin();
//                 }
//                 return;
//             }
//             if (resp !== null) {
//                 resp.setHeader("content-type", res.headers["content-type"]);
//                 resp.end(body, "binary");
//                 return resolve();
//             }
//             return resolve(body);
//         });
//     }, times );
// }

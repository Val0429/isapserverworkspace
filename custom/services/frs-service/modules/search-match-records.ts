import { Response } from '~express/lib/response';
import { FRSService } from './../index';
import * as request from 'request';
import { retry } from 'helpers/utility/retry';
import { semaphore } from './../libs/semaphore';
import { LogTitle, RecognizedUser, UnRecognizedUser, RequestLoginReason, UserType } from 'workspace/custom/services/frs-service/libs/core';
import { Subject } from 'rxjs';
import { FaceFeatureCompare } from './../libs/face-feature-compare';
import { searchRecognizedFace } from '../libs/search-recognized-face';
import { searchUnRecognizedFace } from '../libs/search-unrecognized-face';

import './search-records';
import { Log } from 'helpers/utility';

/**
 * Submodules should take this into consideration:
 * 1) sjLogined
 * 2) sjStarted
 * 3) config.debug
 * 4) when request failed do retry
 * 5) timeout handle
 */

declare module "workspace/custom/services/frs-service/libs/core" {
    interface IFRSConfig {
        specialScoreForUnRecognizedFace?: number;
        possibleCompanionDurationSeconds?: number;
    }
}

declare module "workspace/custom/services/frs-service" {
    interface FRSService {
        searchMatchRecords(user: RecognizedUser | UnRecognizedUser, starttime: Date, endtime: Date, pageSize?: number, times?: number): Subject<RecognizedUser | UnRecognizedUser>;
    }
}

FRSService.initializer.push( function() {
    /// default config //////
    (this as any).config.frs.specialScoreForUnRecognizedFace = (this as any).config.frs.specialScoreForUnRecognizedFace || 0.6;
    (this as any).config.frs.possibleCompanionDurationSeconds = (this as any).config.frs.possibleCompanionDurationSeconds || 15;
    /////////////////////////
});

FRSService.prototype.searchMatchRecords = function(user: RecognizedUser | UnRecognizedUser, starttime: Date, endtime: Date, pageSize: number = 20, times: number = 0): Subject<RecognizedUser | UnRecognizedUser> {
    let sj = new Subject<RecognizedUser | UnRecognizedUser>();

    (async () => {
        /// 0) extract back timestamp from snapshot
        let snapshot = user.snapshot;
        let regex = /^[^0-9]*([0-9]+)/;
        let timestamp = +snapshot.match(regex)[1];
        let istarttime: number = starttime.valueOf();
        let iendtime: number = endtime.valueOf();

        /// 1) get back face_feature
        let faceFeature, faceBuffer;

        let backs: any[] = await this.searchRecords(timestamp-1000, timestamp+1000, pageSize, times)
            .bufferCount(Number.MAX_SAFE_INTEGER)
            .toPromise();

        if (backs === undefined) backs = [];

        for (let back of backs) {
            if (snapshot === back.snapshot) {
                faceFeature = back.face_feature;
                break;
            }
        }
        if (!faceFeature) {
            const errmsg = "<searchMatchRecords> given face not exists in FRS.";
            this.config.debug && Log.Error(LogTitle, errmsg);
            return sj.error(errmsg);
        }
        faceBuffer = new Buffer(faceFeature, 'binary');

        /// 2)
        /// 2.1) adjust starttime / endtime with possible companion duration
        let adjustStartTime = istarttime - this.config.frs.possibleCompanionDurationSeconds*1000;
        let adjustEndTime = iendtime + this.config.frs.possibleCompanionDurationSeconds*1000;
        // this.localFetchAll(adjustStartTime, adjustEndTime, { excludeFaceFeature: user.type === UserType.Recognized ? true : false })
        this.searchRecords(starttime, endtime, pageSize, times)
            .pipe( semaphore<RecognizedUser | UnRecognizedUser>(16, async (data) => {
                if (user.type === UserType.UnRecognized && data.type === UserType.UnRecognized) {
                    let buffer = new Buffer(data.face_feature, 'binary');
                    //let buffer = (data.face_feature as any).buffer;
                    var score = await FaceFeatureCompare.async(faceBuffer, buffer);
                    data.score = score;
                }
                return data;
            }) )
            .pipe( user.type === UserType.Recognized ? searchRecognizedFace(user, this.config.frs) : searchUnRecognizedFace(user, this.config.frs) )
            .subscribe( async (data) => {
                sj.next(data);

            }, () => {}, async () => {
                sj.complete();
            });

    })();
    
    return sj;    
}

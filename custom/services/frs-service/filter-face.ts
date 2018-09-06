import { Observable, Subject } from 'rxjs';
import { Config } from 'core/config.gen';
import { UserType, RecognizedUser, UnRecognizedUser } from './core';
import { FaceFeatureCompare } from './../../modules/face-feature-compare';

interface Indexing {
    [channel: string]: {
        [type: number]: RecognizedUser[] | UnRecognizedUser[];
    }
}

interface Removing {
    [channel: string]: {
        [type: number]: number;
    }
}

let uniqueCount = 0;
const targetScore = Config.fts.specialScoreForUnRecognizedFace;
const traceMilliSeconds = Config.fts.throttleKeepSameFaceSeconds * 1000;
export function filterFace(compareCallback: (face: RecognizedUser | UnRecognizedUser) => void = null) {

    let tryCallback = (face: RecognizedUser | UnRecognizedUser) => {
        compareCallback !== null && compareCallback(face);
    }

    return function(source): Observable<RecognizedUser | UnRecognizedUser> {
        let caches: (RecognizedUser | UnRecognizedUser)[] = [];
        let indexes: Indexing = {};

        let makeRemovingIndexes = (all): Removing => {
            let removing: Removing = {};
            for (let i=0; i<all.length; ++i) {
                let value = all[i];
                let { channel, type } = value;
                /// create default
                let indexChannel = removing[channel];
                if (indexChannel === undefined) indexChannel = removing[channel] = {};
                let indexType = indexChannel[type];
                if (indexType == undefined) indexType = 0;
                /// increase
                indexChannel[type] = indexType+1;
            }
            return removing;
        }

        return Observable.create( (subscriber) => {
            /// if no response more than tracing seconds, resolve.
            source.switchMap( () => {
                return Observable.timer(traceMilliSeconds)
            }).subscribe( () => resolveAll() );

            let resolveAll = () => {
                if (caches.length === 0) return;
                /// 1) remove indexes
                for (let channel in indexes) {
                    let channelObject = indexes[channel];
                    for (let type in channelObject) {
                        /// make clean
                        channelObject[type] = [];
                    }
                }
                /// 2) resolve all
                while (caches.length > 0) subscriber.next(caches.shift());
            }

            let resolveCache = (targetTime: number) => {
                /// 0) nothing to resolve
                if (caches.length === 0) return;
                let lasttime = targetTime || caches[caches.length-1].timestamp;
                /// 1) detect all resolving data at once
                let taken: number = undefined;
                for (let i=0; i<caches.length; ++i) {
                    let data = caches[i];
                    if (lasttime - data.timestamp < traceMilliSeconds) break;
                    taken = i;
                }
                if (taken === undefined) return;
                /// 2) take all
                let all = caches.splice(0, taken+1);
                /// 3) remove indexes
                let removing = makeRemovingIndexes(all);
                for (let channel in removing) {
                    let channelObject = removing[channel];
                    for (let type in channelObject) {
                        let num = channelObject[type];
                        indexes[channel][type].splice(0, num);
                    }
                }
                /// 4) resolve all
                for (let data of all) subscriber.next(data);
            }

            let subscription = source.subscribe( (value: RecognizedUser | UnRecognizedUser) => {
                /// 0) get keys, create default index
                let { channel, type } = value;
                let indexChannel = indexes[channel];
                if (indexChannel === undefined) indexChannel = indexes[channel] = {};
                let indexType = indexChannel[type];
                if (indexType == undefined) indexType = indexChannel[type] = [];

                /// translate face feature as Buffer
                value.face_feature = new Buffer(value.face_feature, 'binary') as any;

                /// 1) replace or new
                switch (type) {
                    case UserType.UnRecognized:
                        let val: UnRecognizedUser = value as UnRecognizedUser;
                        val.valFaceId = ++uniqueCount;
                        resolveCache(val.timestamp);

                        let buffer = val.face_feature as any as Buffer;
                        /// elimate more unrecognized as recognized
                        let indexTypeR = indexChannel[UserType.Recognized] || [];
                        for (let i=indexTypeR.length-1; i>=0; --i) {
                            let prev: RecognizedUser = indexTypeR[i] as RecognizedUser;
                            let highestScore: any = val.highest_score || {};
                            if (prev.person_info.fullname === highestScore.fullname && highestScore.score >= Config.fts.specialScoreForUnRecognizedFace) {
                                /// totally remove this face
                                return;
                            }
                        }

                        /// compare the rest unrecognized as same face
                        for (let i=indexType.length-1; i>=0; --i) {
                            let prev: UnRecognizedUser = indexType[i] as UnRecognizedUser;
                            // var buffer = new Buffer(val.face_feature, 'binary');
                            // var prebuffer = new Buffer(prev.face_feature, 'binary');
                            let prebuffer = prev.face_feature as any as Buffer;
                            let score = FaceFeatureCompare.sync(buffer, prebuffer);
                            if (score < targetScore) continue;
                            /// replace
                            val.timestamp = prev.timestamp;
                            val.valFaceId = prev.valFaceId;
                            tryCallback(val);
                            Object.assign(prev, val);
                            return;
                        }

                        (indexType as UnRecognizedUser[]).push(val);
                        caches.push(val);
                        break;

                    case UserType.Recognized:
                        let valrec: RecognizedUser = value as RecognizedUser;
                        valrec.valFaceId = ++uniqueCount;
                        /// todo workaround: delete empty group
                        valrec.groups.length === 0 && (valrec.groups = undefined);
                        resolveCache(valrec.timestamp);
                        var personId = valrec.person_id;

                        /// merge same recognized user together
                        for (let i=indexType.length-1; i>=0; --i) {
                            let prev: RecognizedUser = indexType[i] as RecognizedUser;
                            if (prev.person_id !== personId) continue;
                            /// replace
                            valrec.timestamp = prev.timestamp;
                            valrec.valFaceId = prev.valFaceId;
                            tryCallback(valrec);
                            Object.assign(prev, valrec);
                            return;
                        }
                        // for (let i=indexTypeU.length-1; i>=0; --i) {
                        //     let prev: RecognizedUser = indexTypeR[i] as RecognizedUser;
                        //     let highestScore: any = val.highest_score || {};
                        //     if (prev.person_info.fullname === highestScore.fullname && highestScore.score >= Config.fts.specialScoreForUnRecognizedFace) {
                        //         /// totally remove this face
                        //         return;
                        //     }
                        // }

                        /// find previous unrecognized user simular
                        let indexTypeU = indexChannel[UserType.UnRecognized] || [];
                        for (let i=0; i<indexTypeU.length; ++i) {
                            let prev: UnRecognizedUser = indexTypeU[i] as UnRecognizedUser;
                            let highestScore: any = prev.highest_score || {};
                            if (valrec.person_info.fullname === highestScore.fullname && highestScore.score >= Config.fts.specialScoreForUnRecognizedFace) {
                                /// replace this face
                                valrec.timestamp = prev.timestamp;
                                valrec.valFaceId = prev.valFaceId;
                                tryCallback(valrec);
                                Object.assign(prev, valrec);
                                /// put into recognized
                                indexTypeU.splice(i, 1);
                                let indexTypeR: RecognizedUser[] = indexType as RecognizedUser[];
                                let k = indexTypeR.length-1;
                                for (; k>=0; --k) {
                                    let temprec: RecognizedUser = indexTypeR[k];
                                    if (temprec.timestamp < prev.timestamp) break;
                                }
                                indexTypeR.splice(k+1, 0, prev as any as RecognizedUser);

                                /// remove every matches right after
                                for (let j=indexTypeU.length-1; j>=i; --j) {
                                    prev = indexTypeU[j] as UnRecognizedUser;
                                    highestScore = prev.highest_score || {};
                                    if (valrec.person_info.fullname === highestScore.fullname && highestScore.score >= Config.fts.specialScoreForUnRecognizedFace) {
                                        indexTypeU.splice(j, 1);
                                    }
                                }
                                return;
                            }
                        }

                        tryCallback(valrec);
                        (indexType as RecognizedUser[]).push(valrec);
                        caches.push(valrec);
                        break;

                    default: throw "should not happen";
                }

            }, err => subscriber.error(err), () => {
                resolveAll();
                subscriber.complete();
            });
            
            return subscription;

        }).share();
    }
}

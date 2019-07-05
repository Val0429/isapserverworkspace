import { app } from 'core/main.gen';

import './custom/shells/create-index';
import './custom/shells/auto-index';

import * as util from 'util';
const setImmediatePromise = util.promisify(setImmediate);

import { FRSs, sjLiveStream, ILiveFaces } from './custom/models/frss';
import { FaceFeatureCompare } from './custom/services/frs-service/libs/face-feature-compare';
import { createMongoDB, ParseObject } from 'helpers/parse-server/parse-helper';
import { UserType } from 'workspace/custom/services/frs-service/libs/core';
import { Db } from 'mongodb';
import { kaListen } from './cgi-bin/listen';
const shortid = require('shortid');

/// start FRS connection
FRSs.init();

interface RecognizedRelatedUnit {
    frsId: string;
    person_id: string;
    person_info: {
        fullname: string;
        employeeno: string;
    };
    groups: { name: string; group_id: string }[];
}
type RecognizedRelatedData = RecognizedRelatedUnit[];

interface IFaceSource {
    frsId: string;
    snapshot: string;
    channel: string;
    faceFeature: Buffer;
}

/// faces saved in DB
interface NxNFaces {
    /// unique key of face
    _id: string;
    /// private use, group simular faces
    gId: string;
    /// private use, score to group leader.
    gScore: number;
    /// relation to FRS of recognized user
    relations: RecognizedRelatedData;
    /// source of this face
    source: IFaceSource;
    /// for debug
    url: string;
}

/// faces send to WS
interface NxNFacesResult {
    /// unique key of face
    objectId: string;
    /// relation to FRS of recognized user
    relations: RecognizedRelatedData;
    /// source of db matched face
    source: IFaceSource;
    /// for debug
    url: string;

    /// source of current face
    currentSource: IFaceSource;
    /// for debug
    currentUrl: string;

    /// currentSource compare to source
    score: number;
    /// happen time
    timestamp: Date;
}

interface ICompareMatch {
    score: number;
    face: NxNFaces;
}
type ICompareMatches = ICompareMatch[];

const collectionName = "NxNFaces";
const valuableThreshold = 0.3;
const groupingThreshold = 0.7;
const matchingthreshold = 0.9;
// const valuableThreshold = 0.4;
// const groupingThreshold = 0.8;
// const matchingthreshold = 0.96;
const highestMatchesCount = 10;
class ManagedFaces {
    private db: Db;
    private client;
    async init() {
        /// load all NxNFaces
        const { client, db } = await createMongoDB();
        this.db = db;
        this.client = client;
        let col = db.collection(collectionName);
        /// find exists Faces
        console.time("init faces loaded");
        let faces: NxNFaces[] = await col.find({}).toArray();
        this.doInit(faces);
        console.timeEnd("init faces loaded");
    }

    private managedFaces: { [gid: string]: NxNFaces[] } = {};
    private doInit(faces: NxNFaces[]) {
        for (let face of faces) {
            this.doInitOne(face);
        }
    }
    private doInitOne(face: NxNFaces) {
        let gId = face.gId;
        let bucket = this.managedFaces[gId] || (this.managedFaces[gId] = []);
        if (!(face.source.faceFeature instanceof Buffer)) {
            face.source.faceFeature = (face.source.faceFeature as any).read(0, (face.source.faceFeature as any).length());
        }
        bucket.splice( this.pickInsertLocation(bucket, face, "gScore"), 0, face );
    }

    private pickInsertLocation<T>(array: T[], value: T, key: string) {
        var low = 0,
            high = array.length;

        while (low < high) {
            var mid = low + high >>> 1;
            if (array[mid][key] > value[key]) low = mid + 1;
            else high = mid;
        }
        return low;
    }

    private insertHighestMatches(highestMatches: any[], current: ICompareMatch) {
        if (highestMatches.length < highestMatchesCount) {
            return highestMatches.splice( this.pickInsertLocation(highestMatches, current, "score"), 0, current );
        }
        if (highestMatches[highestMatches.length-1].score < current.score) {
            highestMatches.splice( this.pickInsertLocation(highestMatches, current, "score"), 0, current );
            return highestMatches.pop();
        }
    }
    
    async compare(face: ILiveFaces): Promise<NxNFacesResult> {
        let faceFeature = new Buffer(face.face.face_feature, 'binary');
        let highestMatches: ICompareMatches = [];
        let highestGroup: [string?, number?] = [];

        /// 1) input faces
        /// 1.1) compare all, iterate all groups
        main: for (let gid of Object.keys(this.managedFaces)) {
            let nxnfaces = this.managedFaces[gid];

            /// 1.1.1) inside each group, if first one less than ${valuableThreshold}, skip others.
            /// 1.1.2) if first one more than ${valuableThreshold}, save highest score group > ${groupingThreshold}.
            /// 1.1.3) compare with all.
            for (let i=0; i<nxnfaces.length; ++i) {
                let o = nxnfaces[i];
                let score = FaceFeatureCompare.sync(faceFeature, o.source.faceFeature);

                if (i===0) {
                    if (score < valuableThreshold) continue main;
                    if (score > (highestGroup[1] || groupingThreshold)) highestGroup = [gid, score];
                }

                /// 1.2) if any face matches (>= ${matchingThreshold}), done and return.
                /// 1.2.1) before return, update relations and save back
                if (score >= matchingthreshold) {
                    if (face.face.type === UserType.Recognized) {
                        let idx = o.relations.findIndex( (a) => a.frsId === face.frs.id );
                        if (idx < 0) {
                            let unit: RecognizedRelatedUnit = {
                                frsId: face.frs.id,
                                groups: face.face.groups,
                                person_id: face.face.person_id,
                                person_info: face.face.person_info
                            }
                            o.relations.push(unit);
                            let col = this.db.collection(collectionName);
                            /// no await
                            col.updateOne({ _id: o._id }, { $set: { relations: o.relations } });
                        }
                    }
                    /// return
                    return {
                        objectId: o._id,
                        relations: o.relations,
                        source: o.source,
                        url: o.url,
                        currentSource: {
                            frsId: face.frs.id,
                            channel: face.face.channel,
                            snapshot: face.face.snapshot,
                            faceFeature: undefined
                        },
                        currentUrl: `http://${face.frs.attributes.ip}:${face.frs.attributes.port}/frs/cgi/snapshot/image=${face.face.snapshot}`,
                        score,
                        timestamp: new Date(face.face.timestamp)
                    }
                }

                /// 1.3) if not match
                /// 1.3.1) save highest compare match
                this.insertHighestMatches(highestMatches, {
                    score, face: o
                });
            }
            // await setImmediatePromise();
        }
        /// 2.1) if none highestGroup, create with new group.
        /// 2.2) if yes highestGroup, create with exists group.
        console.log("HighestGroup!", highestGroup);
        let c: NxNFaces = {
            _id: shortid.generate(),
            gId: highestGroup.length > 0 ? highestGroup[0] : shortid.generate(),
            gScore: highestGroup.length > 0 ? highestGroup[1] : 1,
            source: {
                frsId: face.frs.id,
                channel: face.face.channel,
                snapshot: face.face.snapshot,
                faceFeature,
            },
            url: `http://${face.frs.attributes.ip}:${face.frs.attributes.port}/frs/cgi/snapshot/image=${face.face.snapshot}`,
            relations: face.face.type === UserType.UnRecognized ? [] : [
                {
                    frsId: face.frs.id,
                    groups: face.face.groups,
                    person_id: face.face.person_id,
                    person_info: face.face.person_info
                }
            ]
        }
        let col = this.db.collection(collectionName);
        col.insertOne(c);
        this.doInitOne(c);
        console.log('goes to end')

        return {
            objectId: c._id,
            relations: c.relations,
            source: c.source,
            url: c.url,
            currentSource: c.source,
            currentUrl: c.url,
            score: 1,
            timestamp: new Date(face.face.timestamp)
        }        
        // return highestMatches.reduce((final, value) => {
        //     final.push({
        //         ...value, face: { ...value.face, source: { ...value.face.source, faceFeature: undefined } }
        //     });
        //     return final;
        // }, []);
    }
}

(async () => {
    let managedFaces = new ManagedFaces();

    await managedFaces.init();

    let count = 0;
    sjLiveStream.subscribe( async (data) => {
        count++;
        const tc = count;
        console.time(`compare #${tc}`);
        let result = await managedFaces.compare(data);
        console.timeEnd(`compare #${tc}`);

        //console.log('result', result);
        let rtn = {
            ...result,
            source: {
                ...result.source,
                faceFeature: undefined,
            },
            currentSource: {
                ...result.currentSource,
                faceFeature: undefined
            }
        }
        kaListen.send(ParseObject.toOutputJSON(rtn));
    });

})();

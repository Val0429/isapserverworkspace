import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { FRSService } from 'workspace/custom/services/frs-service';
import 'workspace/custom/services/frs-service/modules/live-faces';
import 'workspace/custom/services/frs-service/modules/verify-face';
import { Subject } from 'rxjs';
import { RecognizedUser, UnRecognizedUser } from 'workspace/custom/services/frs-service/libs/core';

const request = require('request');

export const sjLiveStream: Subject<ILiveFaces> = new Subject<ILiveFaces>();
export interface ILiveFaces {
    frs: FRSs;
    face: RecognizedUser | UnRecognizedUser;
}

/// FRS list ////////////////////////////////////////
export interface IFRSs {
    ip: string;
    port: number;
    account: string;
    password: string;
}
@registerSubclass({ memoryCache: true }) export class FRSs extends ParseObject<IFRSs> {
    /**
     * init connection to all instances.
     */
    static async init() {
        let frss = await new Parse.Query(FRSs).find();
        
        for (let frs of frss) {
            let objectId = frs.id;
            let { ip, port, account, password } = frs.attributes;
            /// ignore existing FRS
            if (FRSList[objectId]) continue;
            this.update(frs);
        }
    }

    static async update(frs: FRSs) {
        let objectId = frs.id;
        let { ip, port, account, password } = frs.attributes;
        this.delete(frs);
        let instance = FRSList[objectId] = new FRSService({
            debug: true,
            frs: { ip, port, account, password }
        });
        instance.start();
        instance.enableLiveFaces(true);
        instance.sjLiveStream.subscribe( (face) => {
            sjLiveStream.next({ frs, face });
        });

        const doOnce = () => {
            const url = "https://thispersondoesnotexist.com/image";
            request.get({ url, encoding: null }, async (err, res, body) => {
                console.log('image received!');
                await instance.verifyFace({ image: body });
                console.log('verify face sent!');
                setTimeout( () => doOnce(), 0 );
            });
        }
        doOnce();
    }

    static async delete(frs: FRSs) {
        let objectId = frs.id;
        FRSList[objectId] && FRSList[objectId].stop();
    }
}

const FRSList: { [index: string]: FRSService } = {};

////////////////////////////////////////////////////

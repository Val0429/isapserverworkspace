import { Response } from '~express/lib/response';
import { FRSService } from './../index';
import * as request from 'request';
import { retry } from 'helpers/utility/retry';
import { RecognizedUser, UnRecognizedUser } from 'workspace/custom/services/frs-service/libs/core';

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
        snapshot<T extends Response | null, U = T extends null ? Base64String : void>(user: RecognizedUser | UnRecognizedUser, resp?: T): Promise<U>;
    }
}

FRSService.prototype.snapshot = async function<T extends Response | null, U = T extends null ? Base64String : void>(user: RecognizedUser | UnRecognizedUser, resp: T = null): Promise<U> {
    return new Promise<U>( async (resolve, reject) => {

        retry( async () => { return new Promise<U>( async (resolve, reject) => {
            await this.waitForLogin();
            let image = user.snapshot;
            if (!image) throw "RecognizedUser or UnRecognizedUser should provide <snapshot>.";
            const url: string = this.makeUrl(`snapshot/session_id=${this.sessionId}&image=${image}`);
            request({ url, method: 'GET', encoding: null }, (err, res, body) => {
                if (err || res.statusCode !== 200) {
                    return reject(err || body);
                }
                if (resp !== null) {
                    resp.setHeader("content-type", res.headers["content-type"]);
                    resp.end(body, "binary");
                    return resolve();
                }
                return resolve(body);
            });
        }) })
        .then( resolve )
        .catch( reject );

    });
    // return new Promise<string>( async (resolve, reject) => {
    //     await this.waitForLogin();
    //     let url: string = this.makeUrl(`snapshot/session_id=${this.sessionId}&image=${image}`);
    //     request({ url, method: 'GET', encoding: null }, (err, res, body) => {
    //         if (err) { reject(err); return; }
    //         if (resp !== null) {
    //             resp.setHeader("content-type", res.headers["content-type"]);
    //             resp.end(body, "binary");
    //         }
    //         resolve(body);
    //     });
    // });
}


// declare module "workspace/custom/services/frs-service" {
//     interface FRSService {
//         snapshot(image: string, resp?: Response): Promise<string>;
//     }
// }

// type Base64String = string;
// FRSService.prototype.snapshot = async function(image: string, resp: Response = null): Promise<Base64String> {
//     return new Promise<string>( async (resolve, reject) => {
//         await this.waitForLogin();
//         let url: string = this.makeUrl(`snapshot/session_id=${this.sessionId}&image=${image}`);
//         request({ url, method: 'GET', encoding: null }, (err, res, body) => {
//             if (err) { reject(err); return; }
//             if (resp !== null) {
//                 resp.setHeader("content-type", res.headers["content-type"]);
//                 resp.end(body, "binary");
//             }
//             resolve(body);
//         });
//     });
// }

import { Response } from '~express/lib/response';
import { FRSService } from './../index';
import * as request from 'request';
import { retry } from 'helpers/utility/retry';
import { RecognizedUser, UnRecognizedUser, RequestLoginReason } from 'workspace/custom/services/frs-service/libs/core';

type Base64String = string;
declare module "workspace/custom/services/frs-service" {
    interface FRSService {
        snapshot(user: RecognizedUser | UnRecognizedUser, resp?: Response, times?: number): Promise<string>;
    }
}

FRSService.prototype.snapshot = async function(user: RecognizedUser | UnRecognizedUser, resp: Response = null, times = 0): Promise<string> {
    return retry<string>( async (resolve, reject) => {
        await this.waitForLogin();
        let image = user.snapshot;
        if (!image) return reject("RecognizedUser or UnRecognizedUser should provide <snapshot>.");
        const url: string = this.makeUrl(`snapshot/session_id=${this.sessionId}&image=${image}`);
        request({ url, method: 'GET', encoding: null }, async (err, res, body) => {
            if (err || res.statusCode !== 200) {
                reject(err || body.toString());
                if (res.statusCode === 401) {
                    this.sjRequestLogin.next(RequestLoginReason.SessionExpired);
                    await this.waitForLogin();
                }
                return;
            }
            if (resp !== null) {
                resp.setHeader("content-type", res.headers["content-type"]);
                resp.end(body, "binary");
                return resolve();
            }
            return resolve(body);
        });
    }, times, "FRSService.snapshot" );
}

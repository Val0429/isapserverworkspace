import { Response } from '~express/lib/response';
import { FRSService } from '../index';
import * as request from 'request';
import { retry } from 'helpers/utility/retry';
import { RecognizedUser, UnRecognizedUser, RequestLoginReason } from 'workspace/custom/services/frs-service/libs/core';

interface ICompareFace {
    image1: string;
    image2: string;
}

declare module "workspace/custom/services/frs-service" {
    interface FRSService {
        compareFace(face: ICompareFace, times?: number): Promise<{ result: string; score: number; }>;
    }
}

FRSService.prototype.compareFace = async function(face: ICompareFace, times: number = 0): Promise<{ result: string; score: number; }> {
    return retry<any>( async (resolve, reject) => {
        await this.waitForLogin();
        let { image1, image2 } = face;
        const url: string = this.makeUrl(`frs/cgi/compareface`);
        request({
            url, method: 'POST', json: true,
            headers: { "Content-Type": "application/json" },
            body: { session_id: this.sessionId, image_1: image1, image_2: image2 }
        }, async (err, res, body) => {
            if (err || res.statusCode !== 200) {
                reject(err || body.toString());
                if (res.statusCode === 401) {
                    this.sjRequestLogin.next(RequestLoginReason.SessionExpired);
                    await this.waitForLogin();
                }
                return;
            }
            return resolve(body);
        });
    }, times, "FRSService.compareFace");
}

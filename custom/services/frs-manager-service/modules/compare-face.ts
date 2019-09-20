import { Response } from '~express/lib/response';
import { FRSManagerService } from '../index';
import * as request from 'request';
import { retry } from 'helpers/utility/retry';
import { RecognizedUser, UnRecognizedUser, RequestLoginReason } from 'workspace/custom/services/frs-manager-service/libs/core';

interface ICompareFace {
    image1Base64: string;
    image2Base64: string;
}

declare module "workspace/custom/services/frs-manager-service" {
    interface FRSManagerService {
        compareFace(face: ICompareFace, times?: number): Promise<{ result: string; score: number; }>;
    }
}

FRSManagerService.prototype.compareFace = async function(face: ICompareFace, times: number = 0): Promise<{ result: string; score: number; }> {
    return retry<any>( async (resolve, reject) => {
        await this.waitForLogin();
        let { image1Base64, image2Base64 } = face;
        const url: string = this.makeUrl(`setting/frs/compare-face`);
        request({
            url, method: 'POST', json: true,
            headers: { "Content-Type": "application/json" },
            body: { sessionId: this.sessionId, image1Base64, image2Base64 }
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
    }, times, "FRSManagerService.compareFace");
}

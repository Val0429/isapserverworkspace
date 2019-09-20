import { Response } from '~express/lib/response';
import { FRSService } from './../index';
import * as request from 'request';
import { retry } from 'helpers/utility/retry';
import { RecognizedUser, UnRecognizedUser, RequestLoginReason } from 'workspace/custom/services/frs-service/libs/core';

interface IVerifyFace {
    image: Buffer;
    targetScore?: number;
    sourceId?: string;
}

declare module "workspace/custom/services/frs-service" {
    interface FRSService {
        verifyFace(face: IVerifyFace, times?: number): Promise<string>;
    }
}

FRSService.prototype.verifyFace = async function(face: IVerifyFace, times: number = 0): Promise<string> {
    return retry<string>( async (resolve, reject) => {
        await this.waitForLogin();
        let { image, targetScore, sourceId } = face;
        targetScore = targetScore || 0.9;
        sourceId = sourceId || "valtest";
        const url: string = this.makeUrl(`frs/cgi/verifyface`);
        request({
            url, method: 'POST', json: true,
            headers: { "Content-Type": "application/json" },
            body: { session_id: this.sessionId, target_score: targetScore, request_client: sourceId, action_enable: 1, source_id: sourceId, location: sourceId, image: image.toString("base64") }
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
    }, times, "FRSService.verifyFace");
}


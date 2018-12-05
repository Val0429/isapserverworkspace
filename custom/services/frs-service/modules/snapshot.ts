import { Response } from '~express/lib/response';
import { FRSService } from './../index';
import * as request from 'request';

declare module "workspace/custom/services/frs-service" {
    interface FRSService {
        snapshot(image: string, resp?: Response): Promise<string>;
    }
}

type Base64String = string;
FRSService.prototype.snapshot = async function(image: string, resp: Response = null): Promise<Base64String> {
    return new Promise<string>( async (resolve, reject) => {
        await this.waitForLogin();
        let url: string = this.makeUrl(`snapshot/session_id=${this.sessionId}&image=${image}`);
        request({ url, method: 'GET', encoding: null }, (err, res, body) => {
            if (err) { reject(err); return; }
            if (resp !== null) {
                resp.setHeader("content-type", res.headers["content-type"]);
                resp.end(body, "binary");
            }
            resolve(body);
        });
    });
}

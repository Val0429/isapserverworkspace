import { FRSService } from 'workspace/custom/services/frs-service';
import * as HttpClient from 'request';
import { retry } from 'helpers/utility/retry';

declare module 'workspace/custom/services/frs-service' {
    interface FRSService {
        GetEntrances(times?: number): Promise<{ objectId: string; name: string }[]>;
    }
}

FRSService.prototype.GetEntrances = async function(times: number = 0): Promise<{ objectId: string; name: string }[]> {
    return retry<{ objectId: string; name: string }[]>(
        async (resolve, reject) => {
            try {
                await this.waitForLogin();

                let url: string = `${this.makeUrl(`devicegroup`)}?sessionId=${this.sessionId}`;
                HttpClient.get(
                    {
                        url: url,
                        json: true,
                    },
                    (error, response, body) => {
                        if (error) {
                            return reject(error);
                        } else if (response.statusCode !== 200) {
                            return reject(`${response.statusCode}, ${body.toString().replace(/(\r)?\n/g, '; ')}`);
                        }

                        resolve(
                            (body.results || []).map((value, index, array) => {
                                return {
                                    objectId: value.objectId,
                                    name: value.name,
                                };
                            }),
                        );
                    },
                );
            } catch (e) {
                throw e;
            }
        },
        times,
        'FRSService.GetEntrances',
    );
};

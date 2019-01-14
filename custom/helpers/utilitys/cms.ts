import * as HttpClient from 'request';
import { Config } from '../../../config/custom/cms';

export namespace Cms {
    /**
     * Get snapshot from cms
     * @param ip
     * @param port
     * @param nvr
     * @param channel
     */
    export async function GetSnapshot(config: Config, nvr: number, channel: number): Promise<{ buffer: Buffer; date: Date }> {
        try {
            // http://172.16.10.100:7000/cgi-bin/snapshot?nvr=nvr1&channel=channel2&source=backend&timestamp=1546582859401
            let url: string = `http://${config.ip}:${config.port}/cgi-bin/snapshot?nvr=nvr${nvr}&channel=channel${channel}`;

            let date: Date = new Date();
            let buffer: Buffer = await new Promise<Buffer>((resolve, reject) => {
                try {
                    HttpClient(
                        {
                            url: url,
                            method: 'get',
                            encoding: null,
                            auth: {
                                user: config.account,
                                pass: config.password,
                            },
                        },
                        (error, response, body) => {
                            if (error) {
                                return reject(error);
                            } else if (response.statusCode !== 200) {
                                return reject(`${response.statusCode}, ${Buffer.from(body).toString()}`);
                            }

                            resolve(body);
                        },
                    );
                } catch (e) {
                    return reject(e);
                }
            }).catch((e) => {
                throw e;
            });

            return { buffer: buffer, date: date };
        } catch (e) {
            throw e;
        }
    }
}

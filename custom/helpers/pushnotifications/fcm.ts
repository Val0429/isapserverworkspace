import FCM = require('fcm-push');
import { Config } from 'core/config.gen';

export class Fcm {
    /**
     * Fcm
     */
    private fcm = null;

    /**
     * Constructor
     */
    public constructor() {
        this.fcm = new FCM(Config.pushnotification.fcm.serverKey);
    }

    /**
     * Send notification
     * @param deviceToken
     * @param title
     * @param body
     * @param data
     */
    public async Send(deviceToken: string, title: string, body: string): Promise<string> {
        let message = {
            to: deviceToken,
            collapse_key: Config.pushnotification.fcm.collapseKey,
            data: {
                custom_notification: {
                    title: title,
                    body: body,
                },
            },
        };

        let response = await new Promise<string>((resolve, reject) => {
            try {
                this.fcm.send(message, function(e, response) {
                    if (e) {
                        return reject(e);
                    } else {
                        return resolve(response);
                    }
                });
            } catch (e) {
                return reject(e);
            }
        }).catch((e) => {
            throw e;
        });

        return response;
    }
}

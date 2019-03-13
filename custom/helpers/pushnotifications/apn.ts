import PushNotifications = require('node-pushnotifications');
import { Config } from 'core/config.gen';

export class Apn {
    private apn = null;

    /**
     * Constructor
     */
    public constructor() {
        let setting = {
            apn: {
                token: {
                    key: Config.pushnotification.apn.key,
                    keyId: Config.pushnotification.apn.keyId,
                    teamId: Config.pushnotification.apn.teamId,
                },
                production: Config.pushnotification.apn.production,
            },
        };

        this.apn = new PushNotifications(setting);
    }

    /**
     * Send notification
     * @param deviceToken
     * @param title
     * @param body
     * @param data
     */
    public async Send(deviceToken: string, title: string, body: string): Promise<string> {
        var data = {
            retryLimit: 1,
            expiry: Math.floor(Date.now() / 1000) + 3600,
            priority: 10,
            encoding: '',
            badge: 1,
            sound: 'default',
            alert: {
                title: title,
                body: body,
            },
            topic: Config.pushnotification.apn.topic,
            category: '',
            contentAvailable: true,
            truncateAtWordEnd: true,
            mutableContent: 0,
        };

        let response = await new Promise<string>((resolve, reject) => {
            try {
                this.apn.send(deviceToken, data, (e, response) => {
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

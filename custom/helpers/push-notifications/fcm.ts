import FCM = require('fcm-push');

export class Fcm {
    /**
     * Config
     */
    private _config: Fcm.IConfig = undefined;

    /**
     * Fcm
     */
    private _fcm = null;

    /**
     * Constructor
     */
    public constructor(config: Fcm.IConfig) {
        this._config = config;

        this._fcm = new FCM(this._config.serverKey);
    }

    /**
     * Send notification
     * @param deviceToken
     * @param title
     * @param body
     */
    public async Send(deviceToken: string, title: string, body: string): Promise<string> {
        let message = {
            to: deviceToken,
            collapse_key: this._config.collapseKey,
            data: {
                custom_notification: {
                    title: title,
                    body: body,
                },
            },
        };

        let response = await new Promise<string>((resolve, reject) => {
            try {
                this._fcm.send(message, function(e, response) {
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

export namespace Fcm {
    /**
     *
     */
    export interface IConfig {
        serverKey: string;
        collapseKey: string;
    }
}

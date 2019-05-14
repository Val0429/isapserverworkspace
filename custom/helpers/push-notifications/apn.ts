import * as APN from 'apn';

export class Apn {
    /**
     * Config
     */
    private _config: Apn.IConfig = undefined;

    /**
     * Apn
     */
    private _apn: APN.Provider = undefined;

    /**
     * Constructor
     */
    public constructor(config: Apn.IConfig) {
        this._config = config;

        let setting = {
            token: {
                key: config.key,
                keyId: config.keyId,
                teamId: config.teamId,
            },
            production: config.production,
        };

        this._apn = new APN.Provider(setting);
    }

    /**
     * Send notification
     * @param deviceToken
     * @param title
     * @param body
     */
    public async Send(deviceToken: string, title: string, body: string): Promise<APN.Responses> {
        let note: APN.Notification = new APN.Notification();

        note.expiry = Math.floor(Date.now() / 1000) + 3600;
        note.badge = 1;
        note.sound = 'default';
        note.alert = {
            title: title,
            body: body,
        };
        note.topic = this._config.topic;

        let response: APN.Responses = await this._apn.send(note, deviceToken).catch((e) => {
            throw e;
        });

        return response;
    }
}

export namespace Apn {
    /**
     *
     */
    export interface IConfig {
        key: string;
        keyId: string;
        teamId: string;
        production: boolean;
        topic: string;
    }
}

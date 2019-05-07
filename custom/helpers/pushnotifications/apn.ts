import * as APN from 'apn';
import { Config } from 'core/config.gen';

export class Apn {
    private apn: APN.Provider = undefined;

    /**
     * Constructor
     */
    public constructor() {
        let setting = {
            token: {
                key: Config.pushnotification.apn.key,
                keyId: Config.pushnotification.apn.keyId,
                teamId: Config.pushnotification.apn.teamId,
            },
            production: Config.pushnotification.apn.production,
        };

        this.apn = new APN.Provider(setting);
    }

    /**
     * Send notification
     * @param deviceToken
     * @param title
     * @param body
     * @param data
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
        note.topic = Config.pushnotification.apn.topic;

        let response: APN.Responses = await this.apn.send(note, deviceToken).catch((e) => {
            throw e;
        });

        return response;
    }
}

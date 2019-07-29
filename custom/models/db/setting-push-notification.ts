import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * FCM 設定
 */
export interface IFcm {
    /**
     *
     */
    serverKey: string;

    /**
     *
     */
    collapseKey: string;
}

/**
 * APN 設定
 */
export interface IApn {
    /**
     *
     */
    key: string;

    /**
     *
     */
    keyId: string;

    /**
     *
     */
    teamId: string;

    /**
     *
     */
    topic: string;
}

/**
 * Push Notification 設定
 */
export interface ISettingPushNotification {
    /**
     *
     */
    enable: boolean;

    /**
     *
     */
    fcm: IFcm;

    /**
     *
     */
    apn: IApn;
}

@registerSubclass()
export class SettingPushNotification extends ParseObjectNotice<ISettingPushNotification> {}

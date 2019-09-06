import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * Sg SMS 設定
 */
export interface ISgSMS {
    /**
     *
     */
    url: string;

    /**
     *
     */
    account: string;

    /**
     *
     */
    password: string;
}

/**
 * Text Message 設定
 */
export interface ISettingTextMessage {
    /**
     *
     */
    enable: boolean;

    /**
     *
     */
    sgsms: ISgSMS;
}

@registerSubclass()
export class SettingTextMessage extends ParseObjectNotice<ISettingTextMessage> {}

import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * Email 設定
 */
export interface ISettingEmail {
    /**
     *
     */
    enable: boolean;

    /**
     *
     */
    host: string;

    /**
     *
     */
    port: number;

    /**
     *
     */
    email: string;

    /**
     *
     */
    password: string;
}

@registerSubclass()
export class SettingEmail extends ParseObjectNotice<ISettingEmail> {}

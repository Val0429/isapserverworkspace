import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * System 設定
 */
export interface ISettingSystem {
    /**
     *
     */
    hosting: string;
}

@registerSubclass()
export class SettingSystem extends ParseObjectNotice<ISettingSystem> {}

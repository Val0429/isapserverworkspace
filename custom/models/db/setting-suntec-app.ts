import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationFloors } from './_index';

/**
 * Suntec App 設定
 */
export interface ISettingSuntecApp {
    /**
     *
     */
    host: string;

    /**
     *
     */
    token: string;
}

@registerSubclass()
export class SettingSuntecApp extends ParseObjectNotice<ISettingSuntecApp> {}

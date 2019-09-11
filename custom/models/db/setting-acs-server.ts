import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationFloors } from './_index';

/**
 * ACS Server 設定
 */
export interface ISettingACSServer {
    /**
     *
     */
    ip: string;

    /**
     *
     */
    port: number;

    /**
     *
     */
    serviceId: string;
}

@registerSubclass()
export class SettingACSServer extends ParseObjectNotice<ISettingACSServer> {}

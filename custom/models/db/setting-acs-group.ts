import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationBuildings } from './_index';

/**
 * ACS Group 設定
 */
export interface ISettingACSGroup {
    /**
     *
     */
    building: LocationBuildings;

    /**
     *
     */
    group: string;
}

@registerSubclass()
export class SettingACSGroup extends ParseObjectNotice<ISettingACSGroup> {}

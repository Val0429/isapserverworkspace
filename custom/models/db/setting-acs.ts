import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

interface IRange {
    min: number;
    max: number;
}

/**
 * ACS 設定
 */
export interface ISettingACS {
    /**
     *
     */
    staffCardRange: IRange;

    /**
     *
     */
    visitorCardRange: IRange;

    /**
     *
     */
    isUseACSServer: boolean;
}

@registerSubclass()
export class SettingACS extends ParseObjectNotice<ISettingACS> {}

import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * Darksky 設定
 */
export interface IDarksky {
    /**
     *
     */
    secretKey: string;
}

/**
 * Weather 設定
 */
export interface ISettingWeather {
    /**
     *
     */
    enable: boolean;

    /**
     *
     */
    darksky: IDarksky;
}

@registerSubclass()
export class SettingWeather extends ParseObjectNotice<ISettingWeather> {}

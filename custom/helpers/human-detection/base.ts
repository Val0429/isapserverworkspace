import { Draw } from '../';

export namespace Base {
    /**
     *
     */
    export interface ILocation extends Draw.ILocation {
        score: number;
    }

    /**
     *
     */
    export enum Message {
        ConfigNotSetting = 'config is not setting',
        SettingPortError = 'port should between 1 to 65535',
        SettingIpError = 'illegal Ip format',
        NotInitialization = 'not initialization',
    }
}

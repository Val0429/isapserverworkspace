import { Draw } from '../';

export namespace HumanDetection {
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
        SettingPortError = 'Port should between 1 to 65535',
        SettingIpError = 'Illegal Ip format',
        SettingAppPathError = 'Yolo application path is empty',
        SettingAppFileError = 'Yolo application file is empty',
        SettingInputFileError = 'Input file is empty',
        NotInitialization = 'Is not initialization yet',
    }
}

import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Hanwha } from '../../helpers/people-counting/hanwha';

/**
 * 和華相機設定
 */
export interface IConfigHanwha {
    /**
     * Camera 設定
     */
    cameraConfig: Hanwha.IConfig;

    /**
     * Nvr 設定
     */
    nvrConfig: Hanwha.IConfig;
}

@registerSubclass()
export class ConfigHanwha extends ParseObject<IConfigHanwha> {}

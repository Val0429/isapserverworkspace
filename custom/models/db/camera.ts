import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IBase, IConfigCMSCamera } from './_index';
import * as Enum from '../../enums';

/**
 * 相機
 */
export interface ICamera {
    /**
     * 名稱
     */
    name: string;

    /**
     * 模式
     */
    mode: Enum.ECameraMode;

    /**
     * 類型
     */
    type: Enum.ECameraType;

    /**
     * 設定
     */
    config: IConfigCMSCamera;
}

@registerSubclass()
export class Camera extends ParseObject<ICamera> {}

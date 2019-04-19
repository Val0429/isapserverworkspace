import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IBase, LocationFloor, LocationArea, Camera } from './_index';
import * as Enum from '../../enums';

/**
 * 裝置
 */
export interface ILocationDevice extends IBase {
    /**
     * 樓層
     */
    floor: LocationFloor;

    /**
     * 區域
     */
    area: LocationArea;

    /**
     * 裝置類型
     */
    type: Enum.EDeviceType;

    /**
     * 相機
     */
    camera: Camera;

    /**
     * 名稱
     */
    name: string;

    /**
     * 圖示
     */
    iconSrc: string;

    /**
     * 寬
     */
    iconWidth: number;

    /**
     * 高
     */
    iconHeight: number;

    /**
     * X
     */
    x: number;

    /**
     * Y
     */
    y: number;

    /**
     * 角度
     */
    angle: number;

    /**
     * 可視距離
     */
    visibleDistance: number;

    /**
     * 可視角
     */
    visibleAngle: number;
}

@registerSubclass()
export class LocationDevice extends ParseObject<ILocationDevice> {}

import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationSite, LocationArea, DeviceGroup, ICameraCMS, ICameraFRSManager, ICameraFRS, ICameraHanwha, ServerDemographic, ServerHumanDetection } from './_index';
import * as Enum from '../../enums';
import { Draw } from '../../helpers';

/**
 * 裝置
 */
export interface IDevice {
    /**
     * Custom id
     */
    customId: string;

    /**
     * Site
     */
    site?: LocationSite;

    /**
     * 區域
     */
    area?: LocationArea;

    /**
     * 群組
     */
    groups: DeviceGroup[];

    /**
     * 名稱
     */
    name: string;

    /**
     * 類型
     */
    brand: Enum.EDeviceBrand;

    /**
     * 模組
     */
    model?: Enum.EDeviceModelHanwha | Enum.EDeviceModelIsap;

    /**
     * 模式
     */
    mode: Enum.EDeviceMode;

    /**
     * 設定
     */
    config: ICameraCMS | ICameraFRSManager | ICameraFRS | ICameraHanwha;

    /**
     * Demographic server
     */
    demoServer: ServerDemographic;

    /**
     * Human Detection server
     */
    hdServer: ServerHumanDetection;

    /**
     * 方向
     */
    direction?: Enum.EDeviceDirection;

    /**
     * ROI
     */
    rois: Draw.ILocation[];

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

    /**
     * data window X
     */
    dataWindowX: number;

    /**
     * data window Y
     */
    dataWindowY: number;
}

@registerSubclass()
export class Device extends ParseObjectNotice<IDevice> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'Device');
}

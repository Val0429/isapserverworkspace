import { LocationSite, LocationArea, Device, DeviceGroup } from './_index';

/**
 * 報告
 */
export interface IReportBase {
    /**
     * 地區
     */
    site: LocationSite;

    /**
     * 區域
     */
    area: LocationArea;

    /**
     * 裝置群組
     */
    groups: DeviceGroup[];

    /**
     * 裝置
     */
    device: Device;

    /**
     * 時間
     */
    date: Date;
}

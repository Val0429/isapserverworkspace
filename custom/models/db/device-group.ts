import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationSite, LocationArea } from './_index';
import * as Enum from '../../enums';

/**
 * 地區
 */
export interface IDeviceGroup {
    /**
     * Site
     */
    site: LocationSite;

    /**
     * 區域
     */
    area: LocationArea;

    /**
     * 模式
     */
    mode: Enum.EDeviceMode;

    /**
     * 名稱
     */
    name: string;
}

@registerSubclass()
export class DeviceGroup extends ParseObjectNotice<IDeviceGroup> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'DeviceGroup');
}

import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Rx from 'rxjs';
import { LocationSite, LocationArea } from './_index';
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

export let DeviceGroup$: Rx.Subject<{ crud: 'c' | 'r' | 'u' | 'd' }> = new Rx.Subject();

@registerSubclass()
export class DeviceGroup extends ParseObject<IDeviceGroup> {}

import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Rx from 'rxjs';
import { LocationArea } from './_index';
import { LocationSite } from './location-site';

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
     * 名稱
     */
    name: string;
}

export let DeviceGroup$: Rx.Subject<{ crud: 'c' | 'r' | 'u' | 'd' }> = new Rx.Subject();

@registerSubclass()
export class DeviceGroup extends ParseObject<IDeviceGroup> {}

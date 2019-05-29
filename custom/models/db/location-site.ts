import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Rx from 'rxjs';
import { IDayRange, LocationRegion } from './_index';

/**
 * 地區
 */
export interface ILocationSite {
    /**
     * 地區
     */
    region?: LocationRegion;

    /**
     * 名稱
     */
    name: string;

    /**
     * Custom id
     */
    customId?: string;

    /**
     * Manager
     */
    manager: Parse.User;

    /**
     * 地址
     */
    address?: string;

    /**
     * 電話
     */
    phone?: string;

    /**
     * 開幕時間
     */
    establishment?: Date;

    /**
     * Square meter
     */
    squareMeter?: number;

    /**
     * Number of staff
     */
    staffNumber?: number;

    /**
     * 開門時間
     */
    officeHours?: IDayRange[];

    /**
     * 圖片
     */
    imageSrc: string;

    /**
     * 經度
     */
    longitude?: number;

    /**
     * 緯度
     */
    latitude?: number;
}

export let LocationSite$: Rx.Subject<{ crud: 'c' | 'r' | 'u' | 'd' }> = new Rx.Subject();

@registerSubclass()
export class LocationSite extends ParseObject<ILocationSite> {}

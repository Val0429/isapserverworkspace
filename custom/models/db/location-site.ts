import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationRegion } from './_index';

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

@registerSubclass()
export class LocationSite extends ParseObjectNotice<ILocationSite> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'LocationSite');
}

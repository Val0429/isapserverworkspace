import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IBase, LocationRegion } from './_index';

/**
 * 地點
 */
export interface ILocationSite extends IBase {
    /**
     * 地區
     */
    region: LocationRegion;

    /**
     * 名稱
     */
    name: string;

    /**
     * 經度
     */
    longitude: number;

    /**
     * 緯度
     */
    latitude: number;

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
     * 圖片
     */
    imageSrc: string;

    /**
     * 寬
     */
    imageWidth: number;

    /**
     * 高
     */
    imageHeight: number;
}

@registerSubclass()
export class LocationSite extends ParseObject<ILocationSite> {}

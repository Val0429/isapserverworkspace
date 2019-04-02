import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IBase } from './_index';

/**
 * 地區
 */
export interface ILocationRegion extends IBase {
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
export class LocationRegion extends ParseObject<ILocationRegion> {}

// root;
// country;
// region;
// city;
// district;
// site;
// floor;
// camera;

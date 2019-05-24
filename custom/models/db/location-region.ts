import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { Tree } from 'models/nodes';

/**
 * 地區
 */
export interface ILocationRegion {
    /**
     * 名稱
     */
    name: string;

    /**
     * 層級
     */
    level: number;

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

@registerSubclass({
    container: true,
})
export class LocationRegion extends Tree<ILocationRegion> {
    groupBy: null;
}

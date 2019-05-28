import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { Tree } from 'models/nodes';
import { Tag } from './_index';

/**
 * 地區
 */
export interface ILocationRegion {
    /**
     * 類型
     */
    type: string;

    /**
     * 名稱
     */
    name: string;

    /**
     * Custom id
     */
    customId?: string;

    /**
     * 地址
     */
    address?: string;

    /**
     * Tag
     */
    tags?: Tag[];

    /**
     * 圖片
     */
    imageSrc?: string;

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

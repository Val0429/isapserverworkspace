import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { TreeNotice } from './_index';

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
export class LocationRegion extends TreeNotice<ILocationRegion> {
    groupBy: null;

    static notice$ = TreeNotice._notice$.filter((x) => x.data.className === 'LocationRegion');
}

import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationSite, IThreshold } from './_index';

/**
 * 地區
 */
export interface ILocationArea {
    /**
     * 地區
     */
    site: LocationSite;

    /**
     * 名稱
     */
    name: string;

    /**
     * 圖片
     */
    imageSrc: string;

    /**
     * 地圖
     */
    mapSrc: string;

    /**
     *
     */
    threshold: IThreshold;
}

@registerSubclass()
export class LocationArea extends ParseObjectNotice<ILocationArea> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'LocationArea');
}

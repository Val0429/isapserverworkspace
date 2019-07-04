import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationRegion, LocationSite } from './_index';

/**
 * 標籤
 */
export interface ITag {
    /**
     * 名字
     */
    name: string;

    /**
     * 說明
     */
    description: string;

    /**
     * Region
     */
    regions: LocationRegion[];

    /**
     * Site
     */
    sites: LocationSite[];
}

@registerSubclass()
export class Tag extends ParseObjectNotice<ITag> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'Tag');
}

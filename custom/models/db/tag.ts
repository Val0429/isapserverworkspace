import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { LocationRegion, LocationSite } from './_index';

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
export class Tag extends ParseObject<ITag> {}

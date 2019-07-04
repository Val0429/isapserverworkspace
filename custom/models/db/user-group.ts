import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationSite } from './_index';

/**
 * 群組資料
 */
export interface IUserGroup {
    /**
     * 名字
     */
    name: string;

    /**
     * 說明
     */
    description: string;

    /**
     * Managed sites
     */
    sites: LocationSite[];
}

@registerSubclass()
export class UserGroup extends ParseObjectNotice<IUserGroup> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'UserGroup');
}

import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationCompanies, PersonStaffBlacklistOrignial } from './_index';

/**
 * Person
 */
export interface IPersonStaffBlacklist {
    /**
     *
     */
    creator: Parse.User;

    /**
     *
     */
    updater: Parse.User;

    /**
     *
     */
    company: LocationCompanies;

    /**
     *
     */
    imageBase64: string;

    /**
     *
     */
    imageOrignial: PersonStaffBlacklistOrignial;

    /**
     *
     */
    organization?: string;

    /**
     * 姓名
     */
    name: string;

    /**
     *
     */
    nric: string;

    /**
     * 備註
     */
    remark: string;

    /**
     * FRS person id
     */
    personId: string;
}

@registerSubclass()
export class PersonStaffBlacklist extends ParseObjectNotice<IPersonStaffBlacklist> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'PersonStaffBlacklist');
}

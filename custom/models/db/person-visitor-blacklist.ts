import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationCompanies } from './_index';

/**
 * Person
 */
export interface IPersonVisitorBlacklist {
    /**
     *
     */
    image: Parse.File;

    /**
     *
     */
    company: LocationCompanies;

    /**
     * 姓名
     */
    name: string;

    /**
     *
     */
    nric?: string;

    /**
     * 備註
     */
    remark?: string;
}

@registerSubclass()
export class PersonVisitorBlacklist extends ParseObjectNotice<IPersonVisitorBlacklist> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'PersonVisitorBlacklist');
}

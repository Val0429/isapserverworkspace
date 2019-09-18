import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationCompanies, PersonVisitorBlacklistOrignial } from './_index';

/**
 * Person
 */
export interface IPersonVisitorBlacklist {
    /**
     *
     */
    company: LocationCompanies;

    /**
     *
     */
    imageBase64?: string;

    /**
     *
     */
    imageOrignial?: PersonVisitorBlacklistOrignial;

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
    nric?: string;

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
export class PersonVisitorBlacklist extends ParseObjectNotice<IPersonVisitorBlacklist> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'PersonVisitorBlacklist');
}

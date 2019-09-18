import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationFloors, LocationCompanies } from './_index';

/**
 * Person
 */
export interface IPersonVisitor {
    /**
     *
     */
    card: string;

    /**
     *
     */
    image?: Parse.File;

    /**
     *
     */
    floors: LocationFloors[];

    /**
     *
     */
    company: LocationCompanies;

    /**
     *
     */
    unitNumber: string;

    /**
     * 姓名
     */
    name: string;

    /**
     * email
     */
    email: string;

    /**
     *
     */
    nric?: string;

    /**
     * 電話
     */
    phone?: string;

    /**
     * 備註
     */
    remark?: string;

    /**
     * 進出權限啟用日
     */
    startDate: Date;

    /**
     * 進出權限過期日
     */
    endDate?: Date;
}

@registerSubclass()
export class PersonVisitor extends ParseObjectNotice<IPersonVisitor> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'PersonVisitor');
}

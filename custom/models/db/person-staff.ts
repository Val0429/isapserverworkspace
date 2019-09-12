import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationFloors, LocationCompanies, PersonStaffOrignial } from './_index';

/**
 * Person
 */
export interface IPersonStaff {
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
    card: number;

    /**
     *
     */
    imageBase64?: string;

    /**
     *
     */
    imageOrignial?: PersonStaffOrignial;

    /**
     *
     */
    isUseSuntecReward?: boolean;

    /**
     *
     */
    permissionFloors: LocationFloors[];

    /**
     *
     */
    permissionCompany: LocationCompanies;

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
     * 職位
     */
    position?: string;

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
export class PersonStaff extends ParseObjectNotice<IPersonStaff> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'PersonStaff');
}

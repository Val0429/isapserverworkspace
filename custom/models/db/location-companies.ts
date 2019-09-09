import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationFloors } from './_index';

/**
 * Company
 */
export interface ILocationCompanies {
    /**
     *
     */
    floor: LocationFloors[];

    /**
     *
     */
    name: string;

    /**
     * Contact person name.
     */
    contactPerson: string;

    /**
     * Company's contact phone number.
     */
    contactNumber: string[];

    /**
     * Company's unit number.
     */
    unitNumber: string;
}

@registerSubclass()
export class LocationCompanies extends ParseObjectNotice<ILocationCompanies> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'LocationCompanies');
}

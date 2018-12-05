import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

/// Companies //////////////////////////////////////
export interface ICompanies {
    /**
     * Company name.
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
@registerSubclass() export class Companies extends ParseObject<ICompanies> {}
////////////////////////////////////////////////////

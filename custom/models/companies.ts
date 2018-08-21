import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';
import { Floors } from './floors';

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
    /**
     * Which floor this Company is in.
     */
    floor: Floors[];
}
@registerSubclass() export class Companies extends ParseObject<ICompanies> {}
////////////////////////////////////////////////////

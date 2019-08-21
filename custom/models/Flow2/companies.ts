import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Flow2Floors } from './floors';

/// Companies //////////////////////////////////////
export interface IFlow2Companies {
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
    floor: Flow2Floors[];
}
@registerSubclass() export class Flow2Companies extends ParseObject<IFlow2Companies> {}
////////////////////////////////////////////////////

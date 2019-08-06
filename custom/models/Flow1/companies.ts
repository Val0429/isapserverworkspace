import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Flow1Floors } from './floors';

/// Companies //////////////////////////////////////
export interface IFlow1Companies {
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
    floor: Flow1Floors[];
}
@registerSubclass() export class Flow1Companies extends ParseObject<IFlow1Companies> {}
////////////////////////////////////////////////////

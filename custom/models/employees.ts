import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

/// Employees //////////////////////////////////////
export interface IEmployees {
    /**
     * Number or visitor card.
     */
    cardno: number;
    /**
     * Employee number.
     */
    employeeno: number;
    /**
     * Employee name.
     */
    name: string;
    /**
     * Company's unit number.
     */
    image: Parse.File;
}
@registerSubclass() export class Employees extends ParseObject<IEmployees> {}
////////////////////////////////////////////////////

import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * Person
 */
export interface IPersonStaffOrignial {
    /**
     *
     */
    imageBase64: string;
}

@registerSubclass()
export class PersonStaffOrignial extends ParseObjectNotice<IPersonStaffOrignial> {}

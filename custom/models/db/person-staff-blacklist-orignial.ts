import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * Person
 */
export interface IPersonStaffBlacklistOrignial {
    /**
     *
     */
    imageBase64: string;
}

@registerSubclass()
export class PersonStaffBlacklistOrignial extends ParseObjectNotice<IPersonStaffBlacklistOrignial> {}

import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * Person
 */
export interface IPersonVisitorBlacklistOrignial {
    /**
     *
     */
    imageBase64: string;
}

@registerSubclass()
export class PersonVisitorBlacklistOrignial extends ParseObjectNotice<IPersonVisitorBlacklistOrignial> {}

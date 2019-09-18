import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * Person
 */
export interface IPersonVisitorOrignial {
    /**
     *
     */
    imageBase64: string;
}

@registerSubclass()
export class PersonVisitorOrignial extends ParseObjectNotice<IPersonVisitorOrignial> {}

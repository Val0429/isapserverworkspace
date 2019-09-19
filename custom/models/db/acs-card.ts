import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * ACS 卡號
 */
export interface IACSCard {
    /**
     *
     */
    card: number;
}

@registerSubclass()
export class ACSCard extends ParseObjectNotice<IACSCard> {}

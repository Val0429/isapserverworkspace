import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

import { Flow2Visitors } from './visitors';

/// Blacklists //////////////////////////////////////
export interface IFlow2Blacklists {
    visitor: Flow2Visitors;
    
    nickname: string;
    name: string;
    nric?: string;
    image?: string;
    remark: string;

    /* store for internal use */
    frsmInnerId?: string;
}
@registerSubclass() export class Flow2Blacklists extends ParseObject<IFlow2Blacklists> {}
////////////////////////////////////////////////////

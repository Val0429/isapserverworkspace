import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

import { Flow2Visitors } from './visitors';

import { Flow2Purposes } from './purposes';
import { Pin } from 'services/pin-code';
import { Flow2Companies } from './companies';

export interface IFlow2InvitationNotify {
    visitor: {
        email: boolean;
        phone: boolean;
    }
}

export type IFlow2InvitationVisitors = [Flow2Visitors, ...Array<Flow2Visitors>];

export interface IFlow2InvitationDateUnit {
    start: Date;
    end: Date;
}
export type IFlow2InvitationDate = [IFlow2InvitationDateUnit, ...Array<IFlow2InvitationDateUnit>];

export interface IFlow2Invitations {
    /**
     * Who invites
     */
    parent?: Parse.User;
    /**
     * For Raffle Link case, fill up company when initiate this invitation. 
     */
    company: Flow2Companies;
    /**
     * All visitors being invited
     */
    visitors: IFlow2InvitationVisitors;
    dates: IFlow2InvitationDate;
    purpose?: Flow2Purposes;
    // notify: IFlow2InvitationNotify;
    cancelled?: boolean;
    walkIn?: boolean;
}
@registerSubclass() export class Flow2Invitations extends ParseObject<IFlow2Invitations> {}

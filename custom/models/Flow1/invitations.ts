import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

import { Flow1Visitors } from './visitors';

import { Flow1Purposes } from './purposes';
import { Pin } from 'services/pin-code';
import { Flow1Companies } from './companies';
import { IFlow1WorkPermitAccessGroup } from './crms/work-permit';

export interface IFlow1InvitationNotify {
    visitor: {
        email: boolean;
        phone: boolean;
    }
}

export type IFlow1InvitationVisitors = [Flow1Visitors, ...Array<Flow1Visitors>];

export interface IFlow1InvitationDateUnit {
    start: Date;
    end: Date;
}
export type IFlow1InvitationDate = [IFlow1InvitationDateUnit, ...Array<IFlow1InvitationDateUnit>];

export interface IFlow1Invitations {
    /**
     * Who invites
     */
    parent: Parse.User;
    /**
     * For Raffle Link case, fill up company when initiate this invitation. 
     */
    company: Flow1Companies;
    /**
     * All visitors being invited
     */
    visitors: IFlow1InvitationVisitors;
    pin: Pin;
    dates: IFlow1InvitationDate;
    purpose: Flow1Purposes;
    // notify: IFlow1InvitationNotify;
    cancelled?: boolean;
    // walkIn?: boolean;
    accessGroups?: IFlow1WorkPermitAccessGroup[];
}
@registerSubclass() export class Flow1Invitations extends ParseObject<IFlow1Invitations> {}

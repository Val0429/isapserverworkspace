import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

import { Flow1Visitors } from './visitors';

import { Flow1Purposes } from './purposes';
import { Pin } from 'services/pin-code';

export interface IFlow1InvitationNotify {
    visitor: {
        email: boolean;
        phone: boolean;
    }
}


export interface IFlow1InvitationDate {
    start: Date;
    end: Date;
}

export interface IFlow1Invitations {
    /**
     * Who invites
     */
    parent: Parse.User;
    /**
     * All visitors being invited
     */
    visitors: Flow1Visitors[];
    pin: Pin;
    dates: IFlow1InvitationDate[];
    purpose: Flow1Purposes;
    notify: IFlow1InvitationNotify;
    cancelled?: boolean;
    // walkIn?: boolean;
}
@registerSubclass() export class Flow1Invitations extends ParseObject<IFlow1Invitations> {}

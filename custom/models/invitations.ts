import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

import { Visitors } from './visitors';

import { Purposes } from './../../custom/models/purposes';
import { Pin } from 'services/pin-code/pin-code';

export interface IInvitationNotify {
    visitor: {
        email: string;
        phone: string;
    }
}

export interface IInvitations {
    parent: Parse.User;
    visitor: Visitors;
    dates: Date[];
    pins: Pin[];
    purpose: Purposes;
    notify: IInvitationNotify;
    cancelled?: boolean;
}
@registerSubclass() export class Invitations extends ParseObject<IInvitations> {}

import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

import { Visitors } from './visitors';

import { Purposes } from './../../custom/models/purposes';
import { Pin } from 'services/pin-code';

export interface IInvitationNotify {
    visitor: {
        email: boolean;
        phone: boolean;
    }
}


export interface IInvitationDateAndPin {
    start: Date;
    end: Date;
    pin?: Pin;
    used?: boolean;
}

export interface IInvitations {
    parent: Parse.User;
    visitor: Visitors;
    dates: IInvitationDateAndPin[];
    purpose: Purposes;
    notify: IInvitationNotify;
    cancelled?: boolean;
    walkIn?: boolean;
}
@registerSubclass() export class Invitations extends ParseObject<IInvitations> {}

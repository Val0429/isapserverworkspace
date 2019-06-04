import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';
import { Invitations } from './invitations';

/// Enroll Cards ////////////////////////////////////
export interface IEnrolledCards {
    invitation?: Invitations;
    visitDate?: Date;
    cardno: string;
    name: string;
    email: string;
    qrcode: Parse.File;

    /// not implemented for now
    personId?: string;
    image?: string;
}
@registerSubclass() export class EnrolledCards extends ParseObject<IEnrolledCards> {}
////////////////////////////////////////////////////

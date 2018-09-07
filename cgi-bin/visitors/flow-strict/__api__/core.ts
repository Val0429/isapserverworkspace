import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Errors,
} from 'core/cgi-package';
import { Pin } from 'services/pin-code/pin-code';
import { Invitations, IInvitationDateAndPin } from './../../../../custom/models/invitations';

export interface IResultTryCheckInWithPinCode {
    invitation: Invitations;
    result: IInvitationDateAndPin;
    index: number;
}

export async function tryCheckInWithPinCode(pin: Pin): Promise<IResultTryCheckInWithPinCode> {
    let invitation: Invitations, result: IInvitationDateAndPin, index: number;
    do {
        /// 1) resolve pin
        invitation = await new Parse.Query(Invitations)
            .descending("createdAt")
            .equalTo("dates.pin", pin)
            .include("visitor")
            .include("parent")
            .include("purpose")
            .first();
        if (!invitation) break;

        /// 2) resolve date
        let dates: IInvitationDateAndPin[] = invitation.getValue("dates");
        let now = new Date();

        result = dates.reduce<IInvitationDateAndPin>( (final, value, idx) => {
            if (value.pin !== pin) return final;
            if (value.start <= now && value.end > now) {
                index = idx;
                return value;
            }
            return final;
        }, null);
        if (!result) break;

        return { invitation, result, index }

    } while(0);

    throw Errors.throw( Errors.CustomBadRequest, ["Invalid Pin-Code."] );
}

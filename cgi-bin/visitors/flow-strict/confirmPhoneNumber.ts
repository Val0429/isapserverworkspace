import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, Person, ParseObject,
    Events, EventStrictTryCheckIn
} from 'core/cgi-package';

import { Pin } from 'services/pin-code/pin-code';
import { Invitations, IInvitationDateAndPin } from './../../../custom/models/invitations';
import { tryCheckInWithPinCode } from './__api__/core';

export interface Input {
    pin: Pin;
    phone: string;
}

export type Output = Invitations;

export default new Action<Input, Output>({
    loginRequired: true,
    inputType: "Input",
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    let { pin } = data.inputType;

    let { invitation, result } = await tryCheckInWithPinCode(pin);

    let visitor = invitation.getValue("visitor");
    
    if (visitor.getValue("phone") !== data.inputType.phone)
        throw Errors.throw(Errors.CustomBadRequest, [`Invalid phone number for Pin-Code <${pin}>.`]);

    return ParseObject.toOutputJSON(invitation);
});

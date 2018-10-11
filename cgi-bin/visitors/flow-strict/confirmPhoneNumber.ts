import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, Person, ParseObject,
    Events, EventStrictConfirmPhoneNumber
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
    let { pin, phone } = data.inputType;

    let { owner, invitation, result, company, visitor } = await tryCheckInWithPinCode(pin);
    let kiosk = data.user;
    let eventData = { owner, pin, invitation, company, visitor, phone, kiosk, result: true };

    let saveEvent = () => {
        /// save event
        let event = new EventStrictConfirmPhoneNumber(eventData);
        Events.save(event, {owner, invitation, company, visitor, kiosk});
    }

    /// validate phone
    try {
        if (visitor.getValue("phone") !== data.inputType.phone) {
            eventData.result = false;
            throw Errors.throw(Errors.CustomBadRequest, [`Invalid phone number for Pin-Code <${pin}>.`]);
        }
    } catch(e) { throw e } finally { saveEvent() }

    return ParseObject.toOutputJSON(invitation);
});

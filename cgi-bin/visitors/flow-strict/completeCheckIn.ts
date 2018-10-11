import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, Person, ParseObject,
    Events, EventStrictCompleteCheckIn
} from 'core/cgi-package';

import { Pin } from 'services/pin-code/pin-code';
import { Invitations, IInvitationDateAndPin } from './../../../custom/models/invitations';
import { tryCheckInWithPinCode } from './__api__/core';

export interface Input {
    pin: Pin;
}

export type Output = Invitations;

export default new Action<Input, Output>({
    loginRequired: true,
    inputType: "Input",
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    let { pin } = data.inputType;

    let { owner, invitation, result, company, visitor, index } = await tryCheckInWithPinCode(pin);
    let kiosk = data.user;
    let eventData = { owner, pin, invitation, company, visitor, kiosk };

    let saveEvent = () => {
        /// save event
        let event = new EventStrictCompleteCheckIn(eventData);
        let visitorName = visitor.getValue("name");
        Events.save(event, {owner, invitation, company, visitor, kiosk, visitorName});
    }

    /// invalidate pin
    let dates = invitation.getValue("dates");
    dates[index].used = true;
    invitation.save({
        dates
    });

    saveEvent();

    return ParseObject.toOutputJSON(invitation);
});

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Person, ParseObject,
    Events, EventFlow1StrictTryCheckIn, Flow1Invitations
} from 'core/cgi-package';

import { Pin } from 'services/pin-code';
import { tryCheckInWithPinCode } from './__api__/core';

type EventStrictTryCheckIn = EventFlow1StrictTryCheckIn;
let EventStrictTryCheckIn = EventFlow1StrictTryCheckIn;
type Invitations = Flow1Invitations;

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

    let { owner, invitation, result, company, visitors } = await tryCheckInWithPinCode(pin);
    let kiosk = data.user;

    /// save event
    let event = new EventStrictTryCheckIn({ owner, pin, invitation, company, kiosk });
    let purpose = invitation.getValue("purpose");
    Events.save(event, {owner, invitation, company, kiosk, purpose});

    return ParseObject.toOutputJSON({
        invitation: {
            ...invitation.attributes,
            visitors: invitation.attributes.visitors.map( (v) => v.attributesRemovePrivacy )
        }
    });
});

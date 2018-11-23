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
}

export type Output = Invitations;

export default new Action<Input, Output>({
    loginRequired: true,
    inputType: "Input",
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    let { pin } = data.inputType;

    let { owner, invitation, result, company, visitor } = await tryCheckInWithPinCode(pin);
    let kiosk = data.user;

    /// save event
    let event = new EventStrictTryCheckIn({ owner, pin, invitation, company, visitor, kiosk });
    let visitorName = visitor.getValue("name");
    let purpose = invitation.getValue("purpose");
    Events.save(event, {owner, invitation, company, visitor, kiosk, purpose, visitorName});

    /// enroll into FRS
    /// 1) get all groups
    /// 1.1) find visitor group. if no go 1.2)
    /// 1.2) create visitor group
    /// 2) create person
    /// 2.1) add person into group
    
    /// 1)

    /// remove from FRS
    /// 1) get all groups
    /// 1.1) find visitor group. if no go 1.2)
    /// 2) get all person
    /// 2.1) find all in Visitor group and remove

    return ParseObject.toOutputJSON(invitation);
});

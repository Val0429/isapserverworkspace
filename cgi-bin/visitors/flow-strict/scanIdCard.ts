import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, Person, ParseObject,
    Events, EventStrictScanIDCard
} from 'core/cgi-package';

import { Pin } from 'services/pin-code/pin-code';
import { Invitations, IInvitationDateAndPin } from './../../../custom/models/invitations';
import { tryCheckInWithPinCode } from './__api__/core';

export interface Input {
    pin: Pin;

    name: string;
    birthdate: string;
    idnumber: string;
    images: Parse.File[];
}

export type Output = Invitations;

export default new Action<Input, Output>({
    loginRequired: true,
    inputType: "Input",
    permission: [RoleList.Kiosk],
    postSizeLimit: 1024*1024*10
})
.post(async (data) => {
    let { pin, name, birthdate, idnumber, images } = data.inputType;

    let { owner, invitation, result, company, visitor } = await tryCheckInWithPinCode(pin);
    let kiosk = data.user;
    let eventData = { owner, pin, invitation, company, visitor, kiosk,
        name, birthdate, idnumber, images };

    let saveEvent = () => {
        /// save event
        let event = new EventStrictScanIDCard(eventData);
        let visitorName = visitor.getValue("name");
        let purpose = invitation.getValue("purpose");
        Events.save(event, {owner, invitation, company, visitor, kiosk, purpose, visitorName});
    }

    await visitor.save({
        idcard: {
            name, birthdate, images, idnumber
        }
    });

    saveEvent();

    return ParseObject.toOutputJSON(invitation);
});

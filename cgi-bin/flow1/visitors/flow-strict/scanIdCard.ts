import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Person, ParseObject,
    Events, Flow1Invitations, EventFlow1StrictScanIDCard, Flow1VisitorStatus
} from 'core/cgi-package';

import { Pin } from 'services/pin-code';
import { tryCheckInWithPinCode } from './__api__/core';

type Invitations = Flow1Invitations;
type VisitorStatus = Flow1VisitorStatus;
let VisitorStatus = Flow1VisitorStatus;
type EventStrictScanIDCard = EventFlow1StrictScanIDCard;
let EventStrictScanIDCard = EventFlow1StrictScanIDCard;

export interface Input {
    pin: Pin;

    name: string;
    birthdate: string;
    idnumber: string;
    images: Parse.File[];
    /**
     * Raffle Link special
     */
    unitNumber?: string;
    vehicleNumber?: string;
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

    let { owner, invitation, result, company, visitors } = await tryCheckInWithPinCode(pin);
    let kiosk = data.user;
    let eventData = { owner, pin, invitation, company, kiosk,
        name, birthdate, idnumber, images };

    let saveEvent = () => {
        /// save event
        let event = new EventStrictScanIDCard(eventData);
        let purpose = invitation.getValue("purpose");
        Events.save(event, {owner, invitation, company, kiosk, purpose});
    }

    saveEvent();

    return ParseObject.toOutputJSON(invitation);
});

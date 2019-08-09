import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Person, ParseObject, FileHelper, Config,
    Events,
    Flow1Invitations,
    EventFlow1StrictCompleteCheckIn
} from 'core/cgi-package';

import { Pin } from 'services/pin-code';
import { tryCheckInWithPinCode } from './__api__/core';

import { FRSService } from 'workspace/custom/services/frs-service';
import 'workspace/custom/services/frs-service/modules/group-and-person';
const FRS = FRSService.sharedInstance();

type Invitations = Flow1Invitations;

type EventStrictCompleteCheckIn = EventFlow1StrictCompleteCheckIn;
let EventStrictCompleteCheckIn = EventFlow1StrictCompleteCheckIn;

export interface Input {
    pin: Pin;
    name: string;
    liveFace: string;
}

export type Output = Invitations;

export default new Action<Input, Output>({
    loginRequired: true,
    inputType: "Input",
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    let { pin, name, liveFace } = data.inputType;
    let request = data.request;

    let { owner, invitation, result, company, visitors, index } = await tryCheckInWithPinCode(pin);
    let kiosk = data.user;
    let eventData = { owner, pin, invitation, company, kiosk, visitorName: name };

    let saveEvent = () => {
        /// save event
        let event = new EventStrictCompleteCheckIn(eventData);
        let purpose = invitation.getValue("purpose");
        Events.save(event, {owner, invitation, company, kiosk, purpose, visitorName: name});
    }

    saveEvent();
    
    /// enroll into FRS
    /// 1) get all groups
    /// 1.1) find visitor group. if no go 1.2)
    /// 1.2) create visitor group
    /// 2) create person
    /// 2.1) find last compare face
    /// 2.2) create person
    /// 2.3) add person into group
    
    /// 1)
    let groups = await FRS.getGroupList();
    /// 1.1)
    let groupid: string = groups.reduce<string>( (final, value) => {
        if (final) return final;
        if (value.name === 'Visitor') return value.group_id;
        return final;
    }, undefined);
    /// 1.2)
    if (groupid === undefined) {
        let res = await FRS.createGroup("Visitor");
        groupid = res.group_id;
    }
    /// 2)
    /// 2.1)
    /// 2.2)
    let person = await FRS.createPerson(name, liveFace);
    /// 2.3)
    await FRS.applyGroupsToPerson(person.person_id, groupid);

    return ParseObject.toOutputJSON({
        invitation: {
            ...invitation.attributes,
            visitors: invitation.attributes.visitors.map( (v) => v.attributesRemovePrivacy )
        }
    });
});


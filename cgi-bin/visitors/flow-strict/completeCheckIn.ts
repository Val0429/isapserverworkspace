import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Person, ParseObject, FileHelper,
    Events, EventStrictCompleteCheckIn, EventStrictCompareFace, Tablets, EnrolledCards, IEnrolledCards
} from 'core/cgi-package';

import { IssueCard } from './__api__/issueCard';

import frs from './../../../custom/services/frs-service';

import { Pin } from 'services/pin-code';
import { Invitations, IInvitations, IInvitationDateAndPin } from './../../../custom/models/invitations';
import { tryCheckInWithPinCode } from './__api__/core';

export interface Input {
    pin: Pin;
}

export type Output = IInvitations & {
    qrcode: Parse.File;
};

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
    let visitorName = visitor.getValue("name");

    let saveEvent = () => {
        /// save event
        let event = new EventStrictCompleteCheckIn(eventData);
        let visitorName = visitor.getValue("name");
        let purpose = invitation.getValue("purpose");
        Events.save(event, {owner, invitation, company, visitor, kiosk, purpose, visitorName});
    }

    /// invalidate pin
    let dates = invitation.getValue("dates");
    dates[index].used = true;
    invitation.save({
        dates
    });

    saveEvent();

    let visitorEmail = visitor.getValue("email");
    /// Issue Card
    let enrollCard = await IssueCard({
        name: visitorName,
        email: visitorEmail
    });
    
    /// enroll into FRS
    /// 1) get all groups
    /// 1.1) find visitor group. if no go 1.2)
    /// 1.2) create visitor group
    /// 2) create person
    /// 2.1) find last compare face
    /// 2.2) create person
    /// 2.3) add person into group
    
    /// 1)
    let groups = await frs.getGroupList();
    /// 1.1)
    let groupid: string = groups.reduce<string>( (final, value) => {
        if (final) return final;
        if (value.name === 'Visitor') return value.group_id;
        return final;
    }, undefined);
    /// 1.2)
    if (groupid === undefined) {
        let res = await frs.createGroup("Visitor");
        groupid = res.group_id;
    }
    /// 2)
    /// 2.1)
    let lastEvent: EventStrictCompareFace = await new Parse.Query(EventStrictCompareFace)
        .equalTo("visitor", visitor)
        .descending("createdAt")
        .first();
    if (!lastEvent) throw Errors.throw(Errors.CustomBadRequest, ["Should compare face first before check in."]);
    /// 2.2)
    let image = (await FileHelper.downloadParseFile( lastEvent.getValue("image") )).toString("base64");
    let person = await frs.createPerson(visitorName, image);
    /// 2.3)
    await frs.applyGroupsToPerson(person.person_id, groupid);

    return ParseObject.toOutputJSON({
        ...invitation.attributes,
        qrcode: enrollCard.attributes.qrcode
    });
});


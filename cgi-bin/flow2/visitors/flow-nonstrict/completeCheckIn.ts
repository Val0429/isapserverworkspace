import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Person, ParseObject, FileHelper, Config,
    Events,
    EventFlow2StrictCompleteCheckIn,
    Flow2Visitors, Flow2Invitations, Flow2Companies, padLeft
} from 'core/cgi-package';

import VisitorCode from 'workspace/custom/services/visitor-code';
import QRCode from 'services/qr-code';
import * as CryptoJS from 'crypto-js';

import { FRSService } from 'workspace/custom/services/frs-service';
import 'workspace/custom/services/frs-service/modules/group-and-person';
import { ruleCombineVisitors } from '../__api__/core';
import { Flow2ScheduleControllerEmail_CompleteInvitation } from 'workspace/custom/schedulers/Flow2';
import { FRSManagerService } from 'workspace/custom/services/frs-manager-service';

type Invitations = Flow2Invitations;
let Invitations = Flow2Invitations;

type Companies = Flow2Companies;
let Companies = Flow2Companies;

type Visitor = Flow2Visitors;
let Visitor = Flow2Visitors;

type EventStrictCompleteCheckIn = EventFlow2StrictCompleteCheckIn;
let EventStrictCompleteCheckIn = EventFlow2StrictCompleteCheckIn;

type ScheduleControllerEmail_CompleteInvitation = Flow2ScheduleControllerEmail_CompleteInvitation;
let ScheduleControllerEmail_CompleteInvitation = Flow2ScheduleControllerEmail_CompleteInvitation;

export interface Input {
    /**
     * from input
     */
    phone: string;
    email: string;

    /**
     * from id card
     */
    name: string;
    birthdate?: string;
    /**
     * 4 digits
     */
    idnumber: string;
    /**
     * sha256 data
     */
    idref: string;
    images?: Parse.File[];

    company: Companies;
    liveFace: Parse.File;
}

export type Output = Invitations;

export default new Action<Input, Output>({
    loginRequired: true,
    inputType: "Input",
    permission: [RoleList.Kiosk],
    postSizeLimit: 100*1024*1024
})
.post(async (data) => {
    const FRS = FRSService.sharedInstance();
    let { name, phone, email, birthdate, idnumber, idref, images, company, liveFace } = data.inputType;
    let request = data.request;

    /// find out visitor
    let visitor = new Visitor({
        name,
        phone,
        email,
        image: liveFace,
        idcard: {
            name,
            birthdate,
            idnumber,
            images
        },
        company
    });
    let visitors = await ruleCombineVisitors(company, [visitor]);
    visitor = visitors[0];
    /// save visitor
    await visitor.save();

    /// save invitation
    let now = new Date(),
        start = new Date(new Date(now).setHours(0, 0, 0, 0)),
        end = new Date(new Date(now).setHours(23, 59, 59, 0));
    let invitation = new Invitations({
        company,
        visitors: visitors as any,
        dates: [{
            start, end
        } as any],
        walkIn: true
    });
    await invitation.save();

    let kiosk = data.user;
    let eventData = { owner: kiosk, invitation, company, kiosk, visitor, visitorName: name };

    let saveEvent = () => {
        /// save event
        let event = new EventStrictCompleteCheckIn(eventData);
        Events.save(event, {owner: kiosk, invitation, company, kiosk, visitor, visitorName: name});
        return event;
    }
    let event = saveEvent();

    /// issue card - old
    let pin = await VisitorCode.next();
    let year = now.getFullYear()-2000, month = padLeft(now.getMonth()+1, 2), day = padLeft(now.getDate(), 2);
    let encrypted = [
        "0",
        //CryptoJS.AES.encrypt(pin, "Qyz7wQHf96").toString(CryptoJS.enc.Utf8),
        CryptoJS.AES.encrypt(pin, "Qyz7wQHf96").toString(),
        pin,
        `${year}${month}${day}0000`,
        `${year}${month}${day}2359`,
    ].join("");
    let qrcode = await QRCode.make(encrypted);

    // /// issue card - new, via frsm
    // let frsm = FRSManagerService.sharedInstance();
    // frsm.createPerson({

    // })

    /// send email
    for (let visitor of visitors) {
        let email = visitor.getValue("email");
        email && new ScheduleControllerEmail_CompleteInvitation().do(event, { visitor, qrcode });
    }

    return ParseObject.toOutputJSON({
        qrcode: FileHelper.getURL(qrcode, data)
    });
});


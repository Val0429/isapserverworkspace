import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, UserType,
    Action, Errors, Config,
    Events, Flow2Invitations, IFlow2Invitations,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject, ActionParam, Flow2Visitors, Flow2Companies, Flow2VisitorStatus, EventFlow2InvitationComplete, Flow2Purposes, padLeft,
} from 'core/cgi-package';

import PinCode, { Pin } from 'services/pin-code';
import QRCode from 'services/qr-code';
import { Flow2ScheduleControllerEmail_CompleteInvitation } from 'workspace/custom/schedulers/Flow2';
import VisitorCode from 'workspace/custom/services/visitor-code';
import * as CryptoJS from 'crypto-js';

import { ruleCombineVisitors } from './../__api__/core';

let Visitors = Flow2Visitors;
type Visitors = Flow2Visitors;
type Companies = Flow2Companies;
type Purposes = Flow2Purposes;

type IInvitations = IFlow2Invitations;
let Invitations = Flow2Invitations;
type Invitations = Flow2Invitations;

type VisitorStatus = Flow2VisitorStatus;
let VisitorStatus = Flow2VisitorStatus;

type EventInvitationComplete = EventFlow2InvitationComplete;
let EventInvitationComplete = EventFlow2InvitationComplete;

type ScheduleControllerEmail_CompleteInvitation = Flow2ScheduleControllerEmail_CompleteInvitation;
let ScheduleControllerEmail_CompleteInvitation = Flow2ScheduleControllerEmail_CompleteInvitation;

var action = new Action({
    loginRequired: true,
    permission: [RoleList.TenantUser]
});

interface ICInvitations extends IInvitations {
    parent: never;
    pin: never;
    company: never;
}
type InputC = Restful.InputC<ICInvitations>;
type OutputC = Restful.OutputC<ICInvitations>;

// const inviteFilter = { parent: false, visitors: { company: false, status: (status) => getEnumKey(VisitorStatus, status) } };

const inviteFilter = { parent: false, visitors: (visitors) => {
    return visitors.map( v => ({
        ...v.attributesRemovePrivacy,
        status: getEnumKey(VisitorStatus, v.attributes.status)
    }) );
}};

export async function doInvitation(data: ActionParam<ICInvitations>): Promise<Invitations> {
    /// V0) Initiate
    let parent = data.user;
    let cancelled = false;

    /// 1) Create Object
    let obj = new Invitations(data.inputType);

    /// V1.2) Fetch or Create Visitors
    let company = data.user.attributes.company;
    let visitors = await ruleCombineVisitors(company, data.inputType.visitors);
    await Parse.Object.saveAll(visitors);

    /// V2.0) Save
    await obj.save({ parent, cancelled, visitors }, { useMasterKey: true });

    /// V2.1) Save Event
    let invitation = obj;
    let owner = invitation.getValue("parent");
    let event = new EventInvitationComplete({
        owner,
        invitation,
        company,
        visitors
    });
    let purpose = invitation.getValue("purpose");
    Events.save(event, {owner, invitation, company, visitors, purpose});

    let pin = await VisitorCode.next();
    let now = new Date(), year = now.getFullYear()-2000, month = padLeft(now.getMonth()+1, 2), day = padLeft(now.getDate(), 2);
    let encrypted = [
        "0",
        //CryptoJS.AES.encrypt(pin, "Qyz7wQHf96").toString(CryptoJS.enc.Utf8),
        pin,
        `${year}${month}${day}0000`,
        `${year}${month}${day}2359`,
    ].join("");
    let qrcode = await QRCode.make(encrypted);
    /// send email
    for (let visitor of visitors) {
        let email = visitor.getValue("email");
        email && new ScheduleControllerEmail_CompleteInvitation().do(event, { visitor, qrcode });
    }

    return obj;
}

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
action.post<InputC, OutputC>({ inputType: "InputC" }, async (data: ActionParam<ICInvitations>) => {
    let obj = await doInvitation(data);

    /// 3) Output
    return ParseObject.toOutputJSON({
        ...obj.attributes,
        visitors: obj.attributes.visitors.map( (visitor) => visitor.attributesRemovePrivacy )
    }, inviteFilter);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IInvitations>;
type OutputR = Restful.OutputR<IInvitations>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Invitations)
        .include("visitors")
        .include("visitors.privacy")
        .include("company")
        .include("purpose");
        //.equalTo("parent", data.user);

    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters, inviteFilter);
    // , (input) => {
    //     return input.map( (v) => ({ ...v.attributes, visitors: v.attributes.visitors.map( (v) => v.attributesRemovePrivacy ) }) ) as any;
    // });
});

/********************************
 * U: update object
 ********************************/
interface IUInvitations {
    purpose?: Purposes;
    cancelled?: boolean;
}

type InputU = Restful.InputU<IUInvitations>;
type OutputU = Restful.OutputU<IInvitations>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Invitations)
        .include("visitor")
        .include("purpose")
        .get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Invitation <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj, inviteFilter);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IInvitations>;
type OutputD = Restful.OutputD<IInvitations>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Invitations).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Invitation <${objectId}> not exists.`]);
    /// V2) Delete = cancel
    await obj.save({ cancelled: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

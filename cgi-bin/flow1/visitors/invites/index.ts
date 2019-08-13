import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, UserType,
    Action, Errors, Config,
    Events, Flow1Invitations, IFlow1Invitations,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject, ActionParam, Flow1Visitors, Flow1Companies, Flow1VisitorStatus, EventFlow1InvitationComplete, Flow1Purposes,
} from 'core/cgi-package';

import PinCode, { Pin } from 'services/pin-code';
import { Flow1ScheduleControllerEmail_CompleteInvitation } from 'workspace/custom/schedulers';
import QRCode from 'services/qr-code';

let Visitors = Flow1Visitors;
type Visitors = Flow1Visitors;
type Companies = Flow1Companies;
type Purposes = Flow1Purposes;

type IInvitations = IFlow1Invitations;
let Invitations = Flow1Invitations;
type Invitations = Flow1Invitations;

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

interface ICInvitations extends IInvitations {
    parent: never;
    pin: never;
}
type InputC = Restful.InputC<ICInvitations>;
type OutputC = Restful.OutputC<ICInvitations>;

const inviteFilter = { parent: false, visitors: { company: false, status: (status) => getEnumKey(Flow1VisitorStatus, status) } };

async function ruleCombineVisitors(company: Companies, visitors: Visitors[]): Promise<Visitors[]> {
    let resolvedVisitors: Visitors[] = [];

    /// 1) Fetch or Create Visitors
    main: for (let visitor of visitors) {
        let idcard = visitor.get("idcard");
        let email = visitor.get("email");
        let phone = visitor.get("phone");

        /// 2) apply visitor rule
        let savedVisitors = await new Parse.Query(Visitors)
            .include("privacy")
            .equalTo("company", company)
            .find();
        if (idcard && idcard.idnumber && idcard.name) {
            /// 2.1) rule 1: id card + name
            for (let svisitor of savedVisitors) {
                let sidcard = svisitor.get("idcard");
                if (
                    sidcard && sidcard.idnumber && sidcard.name &&
                    idcard.idnumber == sidcard.idnumber && idcard.name == sidcard.name
                ) {
                    resolvedVisitors.push(svisitor);
                    continue main;
                }
            }

        } else if (email) {
            /// 2.2) rule 2: email
            for (let svisitor of savedVisitors) {
                let semail = svisitor.get("email");
                if (
                    semail && email == semail
                ) {
                    resolvedVisitors.push(svisitor);
                    continue main;
                }
            }

        } else if (phone) {
            /// 2.3) rule 3: phone
            for (let svisitor of savedVisitors) {
                let sphone = svisitor.get("phone");
                if (
                    sphone && phone == sphone
                ) {
                    resolvedVisitors.push(svisitor);
                    continue main;
                }
            }
        }
        /// 2.X) no matches, add new
        visitor.set("company", company);
        visitor.set("status", Flow1VisitorStatus.Pending);
        resolvedVisitors.push(visitor);
    }

    return resolvedVisitors;
}


export async function doInvitation(data: ActionParam<ICInvitations>, pin?: Pin): Promise<Flow1Invitations> {
    /// V0) Initiate
    let parent = data.user;
    let cancelled = false;

    /// 1) Create Object
    let obj = new Flow1Invitations(data.inputType);

    /// V1.1) Make Pin
    pin = pin || await PinCode.next();

    /// V1.2) Fetch or Create Visitors
    let company = data.inputType.company;
    let visitors = await ruleCombineVisitors(company, data.inputType.visitors);
    await Parse.Object.saveAll(visitors);

    /// modify touch date
    // let touchDate = data.inputType.dates.reduce( (final, date) => {
    //     return final.valueOf() > date.end.valueOf() ? final : date.end;
    // }, new Date());
    // visitor.setValue("touchDate", touchDate);

    /// V2.0) Save
    await obj.save({ pin, parent, cancelled, visitors }, { useMasterKey: true });

    /// V2.1) Save Event
    let invitation = obj;
    let owner = invitation.getValue("parent");
    let event = new EventFlow1InvitationComplete({
        owner,
        invitation,
        company,
        visitors
    });
    let purpose = invitation.getValue("purpose");
    Events.save(event, {owner, invitation, company, visitors, purpose});

    // let qrcode = await QRCode.make(pin);
    // /// send email
    // if (Config.smtp.enable) {
    //     for (let visitor of visitors) {
    //         let email = visitor.getValue("email");
    //         email && new Flow1ScheduleControllerEmail_CompleteInvitation().do(event, { visitor, qrcode, pin });
    //     }
    // }

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
        .include("visitor")
        .include("company")
        .include("purpose");
        //.equalTo("parent", data.user);

    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters, inviteFilter);
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

// import PinCode from 'services/pin-code';
// import { Invitations, IInvitations } from './../../../custom/models/invitations';
// import { Purposes } from './../../../custom/models/purposes';
// import { Visitors, IVisitors, VisitorStatus } from './../../../custom/models/visitors';

// import { ScheduleControllerEmail_PreRegistration, ScheduleControllerSMS_PreRegistration, ScheduleControllerSGSMS_PreRegistration } from './../../../custom/schedulers/controllers';
// import { validateByInvitationDateAndPin } from '../flow-strict/__api__/core';
// import { IssueCard } from '../flow-strict/__api__/issueCard';

// const inviteFilter = { parent: false, visitor: { company: false, status: (status) => getEnumKey(VisitorStatus, status) } };

// var action = new Action({
//     loginRequired: true,
//     permission: [RoleList.TenantUser]
// });

// /// CRUD start /////////////////////////////////
// /********************************
//  * C: create object
//  ********************************/
// interface ICInvitations extends IInvitations {
//     parent: never;
// }
// type InputC = Restful.InputC<ICInvitations>;
// type OutputC = Restful.OutputC<ICInvitations>;


// export async function doInvitation(data: ActionParam<ICInvitations>) {
//     /// V0) Initiate
//     let parent = data.user;
//     let cancelled = false;

//     /// 1) Create Object
//     let obj = new Invitations(data.inputType);

//     /// V1.1) Make Pins
//     let pins = await PinCode.next(data.inputType.dates.length);
//     /// V1.1.1) Merge Pins
//     for (let i=0; i<pins.length; ++i) data.inputType.dates[i].pin = pins[i];

//     /// V1.2) Fetch or Create Visitors
//     const { phone, email } = data.inputType.visitor.attributes;
//     let userattr = parent.attributes as UserType<RoleList.TenantUser>;
//     let company = userattr.data.company;
//     let visitor = await new Parse.Query(Visitors)
//         .equalTo("company", company)
//         .equalTo("phone", phone)
//         .equalTo("email", email)
//         .first();

//     if (!visitor) {
//         visitor = data.inputType.visitor;
//         visitor.setValue("company", company);
//         visitor.setValue("status", VisitorStatus.Pending);
//     }

//     /// modify touch date
//     let touchDate = data.inputType.dates.reduce( (final, date) => {
//         return final.valueOf() > date.end.valueOf() ? final : date.end;
//     }, new Date());
//     visitor.setValue("touchDate", touchDate);

//     /// V2.0) Save
//     await obj.save({ parent, cancelled, visitor }, { useMasterKey: true });

//     /// V2.1) Save Event
//     let invitation = obj;
//     let owner = invitation.getValue("parent");
//     let event = new EventInvitationComplete({
//         owner,
//         invitation,
//         company,
//         visitor
//     });
//     let visitorName = visitor.getValue("name");
//     let purpose = invitation.getValue("purpose");
//     Events.save(event, {owner, invitation, company, visitor, purpose, visitorName});

//     /// send email
//     data.inputType.notify.visitor.email && Config.smtp.enable && new ScheduleControllerEmail_PreRegistration().do(obj);
//     /// send sms
//     data.inputType.notify.visitor.phone && Config.sms.enable && new ScheduleControllerSMS_PreRegistration().do(obj);
//     data.inputType.notify.visitor.phone && Config.sgsms.enable && new ScheduleControllerSGSMS_PreRegistration().do(obj);

//     /// 3) Output
//     return ParseObject.toOutputJSON(obj, inviteFilter);
// }
// action.post<InputC, OutputC>({ inputType: "InputC" }, async (data: ActionParam<ICInvitations>) => {
//     let result = await doInvitation(data);
//     const { email, name } = data.inputType.visitor.attributes;
//     let visitor = await new Parse.Query(Visitors)
//         .equalTo("email", email)
//         .first();

//     // 2) When Visitor do pre-register complete (or invitation complete & already pre-registered)
//     if (/*visitor.attributes.status === VisitorStatus.Completed && */validateByInvitationDateAndPin(data.inputType.dates, new Date())) {
//         // 	1.1) If the day is today, do (D) (E) (B) (A).
//         IssueCard({
//             name, email
//         });

//     } else {
//         // 	1.2) If not today, do nothing.

//     }

//     return result;
// });

// /********************************
//  * R: get object
//  ********************************/
// type InputR = Restful.InputR<IInvitations>;
// type OutputR = Restful.OutputR<IInvitations>;

// action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
//     /// 1) Make Query
//     var query = new Parse.Query(Invitations)
//         .include("visitor")
//         .include("purpose")
//         .equalTo("parent", data.user);

//     /// 2) With Extra Filters
//     query = Restful.Filter(query, data.inputType);
//     /// 3) Output
//     return Restful.Pagination(query, data.parameters, inviteFilter);
// });

// /********************************
//  * U: update object
//  ********************************/
// interface IUInvitations {
//     purpose?: Purposes;
//     cancelled?: boolean;
// }

// type InputU = Restful.InputU<IUInvitations>;
// type OutputU = Restful.OutputU<IInvitations>;

// action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
//     /// 1) Get Object
//     var { objectId } = data.inputType;
//     var obj = await new Parse.Query(Invitations)
//         .include("visitor")
//         .include("purpose")
//         .get(objectId);
//     if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Invitation <${objectId}> not exists.`]);
//     /// 2) Modify
//     await obj.save({ ...data.inputType, objectId: undefined });
//     /// 3) Output
//     return ParseObject.toOutputJSON(obj, inviteFilter);
// });

// export default action;


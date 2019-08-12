import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Errors,
    Flow1Invitations,
    Flow1Companies,
    Flow1Visitors,
    IFlow1InvitationDate,
    IFlow1InvitationDateUnit,
    IFlow1InvitationVisitors
} from 'core/cgi-package';
import { Pin } from 'services/pin-code';

type IInvitationDate = IFlow1InvitationDate;
type IInvitationDateUnit = IFlow1InvitationDateUnit;

type Invitations = Flow1Invitations;
let Invitations = Flow1Invitations;

type Companies = Flow1Companies;
let Companies = Flow1Companies;

type Visitors = Flow1Visitors;
let Visitors = Flow1Visitors;


export interface IResultTryCheckInWithPinCode {
    invitation: Invitations;
    result: IFlow1InvitationDateUnit;
    company: Companies;
    visitors: IFlow1InvitationVisitors;
    owner: Parse.User;
    index: number;
}

// export function validateByInvitationDateAndPin(dates: IFlow1InvitationDate, date: Date): boolean {
//     for (let tdate of dates) {
//         let start = new Date(tdate.start), end = new Date(tdate.end);
//         if (start <= date && end > date) return true;
//     }
//     return false;
// }

// export function validateInvitationByDate(invitation: Invitations, date: Date): boolean {
//     return validateByInvitationDateAndPin(invitation.attributes.dates, date);
// }

// export async function getOutdatedCardsByDate(date: Date, reverse: boolean = false): Promise<EnrolledCards[]> {
//     const tryReverse = (data) => reverse ? !data : data;
//     let enrolled = await new Parse.Query(EnrolledCards).find();
//     let today = new Date();
//     enrolled = enrolled.filter( (o) => {
//         let { invitation, visitDate } = o.attributes;
//         if (visitDate) {
//             /// date rule
//             visitDate = new Date(visitDate);
//             if (
//                 visitDate.getFullYear() !== today.getFullYear() ||
//                 visitDate.getMonth() !== today.getMonth() ||
//                 visitDate.getDate() !== today.getDate()
//             ) return tryReverse(true);
//             return tryReverse(false);

//         } else {
//             /// invitation rule
//             return tryReverse(!validateInvitationByDate(invitation, today));
//         }
//     });
//     return enrolled;
// }

// export async function getInvitationByDate(date: Date): Promise<Invitations[]> {
//     let invitations = await new Parse.Query(Invitations).find();
//     invitations = invitations.filter( (o) => {
//         return validateInvitationByDate(o, date);
//     });

//     return invitations;
// }

export async function tryCheckInWithPinCode(pin: Pin): Promise<IResultTryCheckInWithPinCode> {
    let invitation: Invitations, result: IInvitationDateUnit, index: number;
    do {
        /// 1) resolve pin
        invitation = await new Parse.Query(Invitations)
            .descending("createdAt")
            .equalTo("pin", pin)
            .include("visitors.privacy")
            .include("parent")
            .include("purpose")
            .first();
        if (!invitation) throw Errors.throw( Errors.CustomBadRequest, ["Pin-Code doesn't exists."] );

        /// 2) resolve date
        let dates: IInvitationDate = invitation.getValue("dates");
        let now = new Date();

        let outdated = true;
        result = dates.reduce<IInvitationDateUnit>( (final, value, idx) => {
            if (final) return final;
            let start = new Date(value.start), end = new Date(value.end);
            if (end < now) outdated = false;
            if (start <= now && end > now) {
                index = idx;
                return value;
            }
            return final;
        }, null);
        //if (!result) break;
        if (!result) {
            if (outdated) throw Errors.throw( Errors.CustomBadRequest, ["Pin-Code has already expired."] );
            throw Errors.throw( Errors.CustomBadRequest, ["Pin-Code has arrived not in authorized time."] );
        }

        /// 3) visitor
        let visitors = invitation.getValue("visitors");

        /// 4) company
        let company = await invitation.getValue("company").fetch();

        /// 5) owner
        let owner = await invitation.getValue("parent").fetch();

        return { invitation, result, company, visitors, owner, index }

    } while(0);

    throw Errors.throw( Errors.CustomBadRequest, ["Invalid Pin-Code."] );
}

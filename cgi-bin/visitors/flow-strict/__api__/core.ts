import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Errors,
    EnrolledCards,
} from 'core/cgi-package';
import { Pin } from 'services/pin-code';
import { Invitations, IInvitationDateAndPin } from './../../../../custom/models/invitations';
import { Companies } from './../../../../custom/models/companies';
import { Visitors } from './../../../../custom/models/visitors';

export interface IResultTryCheckInWithPinCode {
    invitation: Invitations;
    result: IInvitationDateAndPin;
    company: Companies;
    visitor: Visitors;
    owner: Parse.User;
    index: number;
}

export function validateByInvitationDateAndPin(dates: IInvitationDateAndPin[], date: Date): boolean {
    for (let tdate of dates) {
        let start = new Date(tdate.start), end = new Date(tdate.end);
        if (start <= date && end > date) return true;
    }
    return false;
}

export function validateInvitationByDate(invitation: Invitations, date: Date): boolean {
    return validateByInvitationDateAndPin(invitation.attributes.dates, date);
}

export async function getOutdatedCardsByDate(date: Date, reverse: boolean = false): Promise<EnrolledCards[]> {
    const tryReverse = (data) => reverse ? !data : data;
    let enrolled = await new Parse.Query(EnrolledCards).find();
    let today = new Date();
    enrolled = enrolled.filter( (o) => {
        let { invitation, visitDate } = o.attributes;
        if (visitDate) {
            /// date rule
            visitDate = new Date(visitDate);
            if (
                visitDate.getFullYear() !== today.getFullYear() ||
                visitDate.getMonth() !== today.getMonth() ||
                visitDate.getDate() !== today.getDate()
            ) return tryReverse(true);
            return tryReverse(false);

        } else {
            /// invitation rule
            return tryReverse(!validateInvitationByDate(invitation, today));
        }
    });
    return enrolled;
}

export async function getInvitationByDate(date: Date): Promise<Invitations[]> {
    let invitations = await new Parse.Query(Invitations).find();
    invitations = invitations.filter( (o) => {
        return validateInvitationByDate(o, date);
    });

    return invitations;
}

export async function tryCheckInWithPinCode(pin: Pin): Promise<IResultTryCheckInWithPinCode> {
    let invitation: Invitations, result: IInvitationDateAndPin, index: number;
    do {
        /// 1) resolve pin
        invitation = await new Parse.Query(Invitations)
            .descending("createdAt")
            .equalTo("dates.pin", pin)
            .include("visitor")
            .include("parent")
            .include("purpose")
            .first();
        if (!invitation) break;

        /// 2) resolve date
        let dates: IInvitationDateAndPin[] = invitation.getValue("dates");
        let now = new Date();

        result = dates.reduce<IInvitationDateAndPin>( (final, value, idx) => {
            if (value.pin !== pin) return final;
            let start = new Date(value.start), end = new Date(value.end);
            if (start <= now && end > now && value.used !== true) {
                index = idx;
                return value;
            }
            return final;
        }, null);
        if (!result) break;

        /// 3) visitor
        let visitor = await invitation.getValue("visitor").fetch();
        /// 4) company
        let company = await visitor.getValue("company").fetch();
        /// 5) owner
        let owner = await invitation.getValue("parent").fetch();

        return { invitation, result, company, visitor, owner, index }

    } while(0);

    throw Errors.throw( Errors.CustomBadRequest, ["Invalid Pin-Code."] );
}

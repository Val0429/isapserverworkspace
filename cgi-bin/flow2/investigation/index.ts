import {
    express, Request, Response, Router, Restful, Events, EventList,
    IRole, IUser, RoleList, EventSubjects, ParseObject,
    Action, Errors, O, EventType, getEnumKey
} from 'core/cgi-package';

import { Flow2Purposes, Flow2Visitors, Flow2VisitorStatus, Flow2Invitations, Flow2Companies } from '../../../custom/models';

type Purposes = Flow2Purposes;
type Visitors = Flow2Visitors;
type VisitorStatus = Flow2VisitorStatus;
let VisitorStatus = Flow2VisitorStatus;
type Invitations = Flow2Invitations;
type Companies = Flow2Companies;

export interface Input {
    name?: string;
    purpose?: Purposes;
    kiosk?: Parse.User;
    start: Date;
    end: Date;
}

export interface OutputData {
    visitor: Visitors;
    invitation: Invitations;
    owner: Parse.User;
    company: Companies;
    kiosk: Parse.User;
    purpose: Purposes;
    events: EventType<any>[];
}

export type Output = OutputData;

type InputR = Restful.InputR<Input>;
type OutputR = Restful.OutputR<Output>;

var action = new Action<Input, Output>({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

export async function InvestigationResult(data) {
    /// V0) default value
    let { start, end, name, purpose, kiosk } = data.inputType;

    /// 1) Make Query
    let query = new Parse.Query(Events)
        .equalTo("action", EventList.EventFlow2StrictCompleteCheckIn)
        .include("data.company")
        .include("data.visitor")
        .include("data.visitor.privacy")
        ;
    
    start && (query.greaterThanOrEqualTo("createdAt", start));
    end && (query.lessThan("createdAt", end));

    /// V1.1) Filter company or user
    /// Raffle Link only Administrator can see

    /// V1.2) Text search
    if (name) {
        query.contains("data.visitorName", name);
    }
    /// V1.3) purpose & kiosk
    purpose && (query.equalTo("data.purpose.objectId", purpose.id));
    kiosk && (query.equalTo("data.kiosk.objectId", kiosk.id));

    /// 2) With Extra Filters
    //query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters, {

        data: {
            visitor: (v) => {
                return {
                    ...v.attributesRemovePrivacy,
                    status: getEnumKey(VisitorStatus, v.attributes.status),
                    company: undefined
                }
            },
        },

        events: {
            owner: false,
            invitation: false,
            visitor: false,
            company: false,
            kiosk: false,
            purpose: false,
            action: (v) => getEnumKey(EventList, v)
        }
    },
    );
}

action.get<InputR, OutputR>({inputType: "Input"}, async (data) => {
    return InvestigationResult(data);

});

export default action;

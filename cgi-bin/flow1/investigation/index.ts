import {
    express, Request, Response, Router, Restful, Events, EventList,
    IRole, IUser, RoleList, EventSubjects, ParseObject,
    Action, Errors, O, EventType, getEnumKey
} from 'core/cgi-package';

import { Flow1Purposes, Flow1Visitors, Flow1VisitorStatus, Flow1Invitations, Flow1Companies } from './../../../custom/models';

type Purposes = Flow1Purposes;
type Visitors = Flow1Visitors;
type VisitorStatus = Flow1VisitorStatus;
let VisitorStatus = Flow1VisitorStatus;
type Invitations = Flow1Invitations;
type Companies = Flow1Companies;

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
        .equalTo("action", EventList.EventFlow1StrictCompleteCheckIn);
    
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
        visitor: {
            status: (v) => getEnumKey(VisitorStatus, v)
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
    // async (inputEvents) => {
    //     let result = [];
    //     for (let event of inputEvents) {
    //         let data = event.getValue("data");
    //         /// fetch base variables
    //         let visitor = await new Visitors(data.visitor).fetchOrNull();
    //         let company = await new Companies(data.company).fetchOrNull();
    //         let invitation = await new Invitations(data.invitation).fetchOrNull();
    //         let owner = null; try { owner = await data.owner.fetch(); } catch(e) {}
    //         let kiosk = null; try { kiosk = await data.kiosk.fetch(); } catch(e) {}
    //         let purpose = await new Purposes(data.purpose).fetchOrNull();

    //         /// make events
    //         let events = [];

    //         /// fetch related events
    //         let createdAt: Date = event.createdAt;
    //         let endAt = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate()+1);
    //         let relatedEvents: Events[] = await new Parse.Query(Events)
    //             .greaterThanOrEqualTo("createdAt", createdAt)
    //             .lessThan("createdAt", endAt)
    //             .equalTo("data.visitor.objectId", visitor.id)
    //             .find();

    //         // for (let i=0; i<relatedEvents.length; ++i) {
    //         //     let event = relatedEvents[i];
    //         //     if (i>0 && event.getValue("action") === EventList.EventTryCheckIn) break;
    //         //     let entity = event.getValue("entity");
    //         //     await entity.fetch();
    //         //     events.push(entity);
    //         // }
    //         /// "wait all" version
    //         let promises = [];
    //         for (let i=0; i<relatedEvents.length; ++i) {
    //             let event = relatedEvents[i];
    //             if (i>0 && event.getValue("action") === EventList.EventTryCheckIn) break;
    //             let entity = event.getValue("entity");
    //             promises.push( entity.fetchOrNull() );
    //         }
    //         events = await Promise.all(promises);

    //         result.push( {
    //             owner,
    //             visitor,
    //             invitation,
    //             company,
    //             kiosk,
    //             purpose,
    //             events
    //         } );
    //     }

    //     return result;

    // }
    );
}

action.get<InputR, OutputR>({inputType: "Input"}, async (data) => {
    return InvestigationResult(data);

});

export default action;

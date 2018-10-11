import {
    express, Request, Response, Router, Restful, Events, EventList,
    Parse, IRole, IUser, RoleList, EventSubjects, ParseObject,
    Action, Errors, EventStrictCompareFace, O, EventType, getEnumKey
} from 'core/cgi-package';

import { Purposes, Visitors, Invitations, Companies } from './../../../custom/models';

export interface Input {
    name?: string;
    purpose?: Purposes;
    kiosk?: Parse.User;
    start?: Date;
    end?: Date;
}

export interface OutputData {
    visitor: Visitors;
    invitation: Invitations;
    events: EventType<any>[];
}

export type Output = OutputData[];

type InputR = Restful.InputR<Input>;
type OutputR = Restful.OutputR<Output>;

var action = new Action<Input, Output>({
    loginRequired: true,
    permission: [RoleList.Administrator, RoleList.TenantAdministrator, RoleList.TenantUser]
});

action.get<InputR, OutputR>({inputType: "Input"}, async (data) => {
    /// V0) default value
    // if (!data.inputType.start || !data.inputType.end) {
    //     let now = new Date(Date.now());
    //     data.inputType.start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    //     data.inputType.end = new Date(data.inputType.start.valueOf() + 86400*1000);
    // }

    /// 1) Make Query
    let query = new Parse.Query(Events)
        .equalTo("action", EventList.EventStrictTryCheckIn);
    
    data.inputType.start && (query.greaterThanOrEqualTo("createdAt", data.inputType.start));
    data.inputType.end && (query.lessThan("createdAt", data.inputType.end));

    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.inputType, {
        events: {
            owner: false,
            invitation: false,
            visitor: false,
            company: false,
            kiosk: false,
            purpose: false,
            action: (v) => getEnumKey(EventList, v)
        }
    }, async (inputEvents) => {

        let result = [];
        for (let event of inputEvents) {
            let data = event.getValue("data");
            /// fetch base variables
            let visitor = await new Visitors(data.visitor).fetchOrNull();
            let company = await new Companies(data.company).fetchOrNull();
            let invitation = await new Invitations(data.invitation).fetchOrNull();
            let owner = null; try { owner = await new Parse.User(data.owner).fetch(); } catch(e) {}
            let kiosk = null; try { kiosk = await new Parse.User(data.kiosk).fetch(); } catch(e) {}
            let purpose = await new Purposes(data.purpose).fetchOrNull();

            /// make events
            let events = [];

            /// fetch related events
            let createdAt: Date = event.createdAt;
            let endAt = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate()+1);
            let relatedEvents: Events[] = await new Parse.Query(Events)
                .greaterThanOrEqualTo("createdAt", createdAt)
                .lessThan("createdAt", endAt)
                .equalTo("data.visitor.objectId", visitor.id)
                .find();
            for (let i=0; i<relatedEvents.length; ++i) {
                let event = relatedEvents[i];
                if (i>0 && event.getValue("action") === EventList.EventTryCheckIn) break;
                let entity = event.getValue("entity");
                await entity.fetch();
                events.push(entity);
            }

            result.push( {
                owner,
                visitor,
                invitation,
                company,
                kiosk,
                purpose,
                events
            } );
        }

        return result;

    });

    // /// 1) Make Query
    // var query = new Parse.Query(Invitations)
    //     .include("visitor")
    //     .include("purpose")
    //     .equalTo("parent", data.user);

    // /// 2) With Extra Filters
    // query = Restful.Filter(query, data.inputType);
    // /// 3) Output
    // return Restful.Pagination(query, data.inputType, inviteFilter);

});

export default action;

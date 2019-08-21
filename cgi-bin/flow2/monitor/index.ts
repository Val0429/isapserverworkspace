import {
    express, Request, Response, Router, Restful, Events, EventList,
    IRole, IUser, RoleList, ParseObject, EventsSubject,
    Action, Errors, O, EventType, getEnumKey, Flow2Invitations
} from 'core/cgi-package';

import { InvestigationResult } from '../investigation';
import { Subject, Observable } from 'rxjs';

export interface Input {}

import { OutputData } from '../investigation';

export type Output = Restful.InputR<OutputData> | EventType<any>;

type Invitations = Flow2Invitations;
let Invitations = Flow2Invitations;

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

action.ws( async (data) => {
    let socket = data.socket;

    let now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); 
    data.inputType = {
        paging: { all: "true" },
        start,
        end: new Date(start.valueOf() + 86400*1000)
    }
    let result = await InvestigationResult(data);
    socket.send(JSON.stringify(result));

    let allEvents = [];
    function containRole(roles: Parse.Role[], role: RoleList): boolean {
        for (let r of roles) if (r.getName() === role) return true;
        return false;
    }
    let subscription = EventsSubject
        .filter( (events) => {
            // if (containRole(data.role, RoleList.TenantAdministrator)) {
            //     return data.user.get("data").company.id === events.getValue("data").company.objectId;
            // } else if (containRole(data.role, RoleList.TenantUser)) {
            //     return data.user.id === events.getValue("owner").id;
            // }
            /// Raffle Link Admin can see all
            return true;
        })
        .subscribe( async (events) => {
            if (events.getValue("action") !== EventList.EventFlow2StrictCompleteCheckIn) return;

            await events.fetch();
            let entity = await events.getValue("entity").fetch();

            function tryFetch(value): Promise<void> {
                if (!value) return Promise.resolve(null);
                return value.fetch({useMasterKey: true});
            }
            /// include
            await Promise.all(
                ["company", "invitation", "owner", "kiosk"].map((value) => tryFetch(entity.get(value)) )
                );
            let invitation: Invitations = entity.get("invitation");
            invitation && (await invitation.getValue("purpose").fetchOrNull());

            socket.send(ParseObject.toOutputJSON(entity, {
                // visitor: {
                //     status: (v) => getEnumKey(VisitorStatus, v),
                // },
                action: (v) => getEnumKey(EventList, v)
            }));
        });

    socket.io.on("close", () => {
        subscription.unsubscribe();
    });

});

export default action;

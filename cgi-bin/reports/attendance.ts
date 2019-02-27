import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, EventSubjects,
    Action, Errors, EventStrictCompleteCheckIn,
} from 'core/cgi-package';
import { Observable } from 'rxjs';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator]
});

action.ws(async (data) => {
    var socket = data.socket;

    let sendCount = () => {
        socket.send(JSON.stringify({
            onSiteVisitor: total,
            totalVisitor: total
        }));
    }

    let now = new Date(Date.now());
    let date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let total = await new Parse.Query(EventStrictCompleteCheckIn)
        .greaterThanOrEqualTo("createdAt", date)
        .count();

    /// initial number
    sendCount();

    /// hook on event change
    let subscription = EventSubjects.EventStrictCompleteCheckIn
        .subscribe( (data) => {
            ++total;
            sendCount();
        });

    socket.io.on("close", () => {
        subscription.unsubscribe();
    });

});

export default action;

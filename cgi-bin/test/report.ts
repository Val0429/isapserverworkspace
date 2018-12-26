import { Subject } from "rxjs";
import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, IEvent,
} from 'core/cgi-package';

interface IEventType {
    type: 'left' | 'right' | 'double';
    x: number;
    y: number;
}

export const mouseEvents: Subject<IEventType> = new Subject<IEventType>();

export default new Action({
    loginRequired: false
})
.ws(async (data) => {
    let socket = data.socket;
    socket.io.on("message", (value) => {
        value = JSON.parse(value);
        mouseEvents.next(value);
    })
});





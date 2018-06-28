import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from './../../../core/cgi-package';


export interface Input {
    sessionId: string;
}

var action = new Action({
    loginRequired: false
});

action.post<Input>(async (data) => {
    console.log('get', data.request.text);
    return "123";
});

// action.ws(async (data) => {
//     var socket = data.socket;
//     // socket.on("message", (message) => {
//     //     console.log('gotgot', message);
//     //     socket.send(message);
//     // });
// });

export default action;
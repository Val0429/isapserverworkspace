import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
} from 'core/cgi-package';
import { Socket } from 'helpers/sockets/socket-helper';
import { Agent } from 'models/agents';
const sharedAgentJob = Agent.SocketManager.sharedInstance();

export default new Action({
    loginRequired: true
})
.ws(async (data) => {
    /// 1) remember alive agent
    sharedAgentJob.checkIn(data);

    // var socket = data.socket;
    // socket.send("I'm here. go throw");
    // throw Errors.throw(Errors.Custom, ["500 not found"]);

    // var socket = data.socket;
    // socket.send("500 not found");
    // socket.closeGracefully();

    // /// Check param requirement
    // console.log('is it here?', data.parameters);

    // var socket = data.socket;
    // socket.on("message", (message) => {
    //     console.log('gotgot', message);
    //     socket.send(message);
    // });
});

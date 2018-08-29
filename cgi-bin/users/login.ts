import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    bodyParserJson, EventLogin, Events,
    UserHelper, getEnumKey, ParseObject, EnumConverter
} from 'core/cgi-package';


export interface Input {
    username: string;
    password: string;
}

export interface Output {
    sessionId: string;
    serverTime: Date;
    user: Parse.User;
}

export default new Action<Input, Output>({
    loginRequired: false,
    inputType: "Input",
})
.all( async (data) => {
    /// Try login
    var obj = await UserHelper.login(data.inputType);
    let user = await new Parse.Query(Parse.User)
        .include("roles")
        .include("data.company")
        .include("data.floor")
        .get(obj.user.id);

    var ev = new EventLogin({
        owner: user
    });
    Events.save(ev);

    return ParseObject.toOutputJSON({
        sessionId: obj.sessionId,
        serverTime: new Date(),
        user: user
    });
});

// export interface Input {
//     username: string;
//     password: string;
// }

// export interface Output {
//     sessionId: string;
//     serverTime: number;
//     user: Parse.User;
// }

// export default new Action<Input, Output>({
//     loginRequired: false,
//     requiredParameters: ["username"],
//     middlewares: []
// })
// .all(async (data) => {
//     /// Try login
//     var obj = await UserHelper.login({ ...data.parameters });

//     var ev = new EventLogin({
//         owner: obj.user
//     });
//     await Events.save(ev);

//     return {
//         sessionId: obj.sessionId,
//         serverTime: new Date().valueOf(),
//         user: ParseObject.toOutputJSON.call(obj.user, UserHelper.ruleUserRole)
//     }
// });


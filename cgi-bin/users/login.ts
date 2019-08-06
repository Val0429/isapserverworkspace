import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    bodyParserJson, EventLogin, Events,
    UserHelper, getEnumKey, ParseObject, EnumConverter, sharedMongoDB
} from 'core/cgi-package';


interface IInputNormal {
    username: string;
    password: string;
}

interface IInputExtend {
    sessionId: string;
}

export type Input = IInputNormal | IInputExtend;

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
    let sessionId: string, user: Parse.User;
    if ('username' in data.inputType) {
        /// test: cannot login as kiosk
        var kioskRole = await new Parse.Query(Parse.Role)
            .equalTo("name", RoleList.Kiosk)
            .first();

        let testuser = await new Parse.Query(Parse.User)
            .notEqualTo("roles", kioskRole)
            .equalTo("username", data.inputType.username).first();
        if (!testuser) throw Errors.throw(Errors.CustomBadRequest, [`User <${data.inputType.username}> not exists or should not be a kiosk role.`]);

        /// Try login
        var obj = await UserHelper.login(data.inputType);
        sessionId = obj.sessionId;
        user = await new Parse.Query(Parse.User)
            .include("roles")
            .include("data.company")
            .include("data.floor")
            .get(obj.user.id);

        var ev = new EventLogin({
            owner: user
        });
        Events.save(ev);

    } else {
        if (!data.session) throw Errors.throw(Errors.SessionNotExists);
        user = data.user;
        sessionId = data.session.getSessionToken();
    }

    return ParseObject.toOutputJSON({
        sessionId,
        serverTime: new Date(),
        user
    });
});

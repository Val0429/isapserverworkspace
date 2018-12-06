import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    bodyParserJson, EventLogin, Events,
    UserHelper, getEnumKey, ParseObject, EnumConverter, sharedMongoDB
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
        user
    });
});

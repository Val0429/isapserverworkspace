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

    // /// include email
    // let db = await sharedMongoDB();
    // let col = db.collection("_User");
    // let result = await col.findOne({ _id: user.id }, { projection: {email: 1} });
    // let userData = { ...user.attributes, email: result.email, ACL: undefined };

    return ParseObject.toOutputJSON({
        sessionId: obj.sessionId,
        serverTime: new Date(),
        user
    });
});

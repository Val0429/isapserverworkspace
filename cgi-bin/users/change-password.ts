import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Restful,
    bodyParserJson, EventLogin, Events,
    UserHelper, getEnumKey, ParseObject, EnumConverter, sharedMongoDB
} from 'core/cgi-package';


export interface Input {
    oldPassword: string;
    newPassword: string;
}

export interface Output {
    sessionId: string;
    serverTime: Date;
    user: Parse.User;
}

export default new Action<Input, Output>({
    loginRequired: true,
    inputType: "Input",
})
.all( async (data) => {
    /// 1) test login with old password
    let obj;
    try {
        obj = await UserHelper.login({
            username: data.user.get("username"),
            password: data.inputType.oldPassword
        });
    } catch(e) {
        /// 1.1) if failed, throw Errors
        throw Errors.throw(Errors.CustomBadRequest, ["Old password not correct."]);
    }

    /// 1.2) if success, change password
    data.user.setPassword(data.inputType.newPassword);
    await data.user.save(null, {useMasterKey: true});

    /// 2) output user
    return ParseObject.toOutputJSON({
        sessionId: obj.sessionId,
        serverTime: new Date(),
        user: data.user
    });
});

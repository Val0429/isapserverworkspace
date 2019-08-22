import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, UserType,
    Action, Errors, Config,
    Events, Flow1Invitations, IFlow1Invitations,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject, ActionParam
} from 'core/cgi-package';
import { Flow2ScheduleControllerEmail_ForgetPassword } from 'workspace/custom/schedulers/Flow2/controllers/email-@forget-password';
import * as shortid from 'shortid';

var action = new Action({
    loginRequired: false
});

interface InputC {
    email: string;
}

/// C: forget password ////////////////////
action.post<InputC>({ inputType: "InputC" }, async (data) => {
    let { email } = data.inputType;
    let user = await new Parse.Query(Parse.User)
        .equalTo("publicEmailAddress", email)
        .first({ useMasterKey: true });

    if (!user) throw Errors.throw(Errors.CustomBadRequest, ["Email not valid."]);

    let newpassword = shortid.generate();
    user.setPassword(newpassword);
    await user.save(null, { useMasterKey: true });

    let name = user.get("username");
    await new Flow2ScheduleControllerEmail_ForgetPassword().do({
        user: { email, name, newpassword }
    });

    return user;
});
///////////////////////////////////////////

export default action;

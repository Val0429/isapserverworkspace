import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

export type InputU = Restful.InputU<IUser<any>>;
export type OutputU = Restful.OutputU<IUser<any>>;

export default function(action: Action) {

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    var { objectId } = data.inputType;

    var kioskRole = await new Parse.Query(Parse.Role)
        .equalTo("name", RoleList.Kiosk)
        .first();

    /// 1) Get User
    var user = await new Parse.Query(Parse.User)
        .notEqualTo("roles", kioskRole)
        .include("roles")
        .get(objectId);
    if (!user) throw Errors.throw(Errors.CustomNotExists, [`User <${objectId}> not exists.`]);


    /// 2.0) Prepare params to feed in
    var input = { ...data.inputType };
    delete input.username;
    delete input.roles;
    /// 2) Modify
    await user.save(input, {useMasterKey: true});

    /// 3) Hide password
    user.set("password", undefined);

    return ParseObject.toOutputJSON(user);
});

}


import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

export type InputD = Restful.InputD<IUser<any>>;
export type OutputD = Restful.OutputD<IUser<any>>;

export default function(action: Action) {

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    var { objectId } = data.inputType;

    var kioskRole = await new Parse.Query(Parse.Role)
        .equalTo("name", RoleList.Kiosk)
        .first();

    /// 1) Get User
    var user = await new Parse.Query(Parse.User)
        .include("roles")
        .notEqualTo("roles", kioskRole)
        .get(objectId);
    if (!user) throw Errors.throw(Errors.CustomNotExists, [`User <${objectId}> not exists.`]);

    user.destroy({ useMasterKey: true });

    return ParseObject.toOutputJSON(user);
});

}


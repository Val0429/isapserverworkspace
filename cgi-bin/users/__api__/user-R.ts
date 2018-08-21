import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

export type InputR = Restful.InputR<IUser<any>>;
export type OutputR = Restful.OutputR<IUser<any>>;

export default function(action: Action) {

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    var kioskRole = await new Parse.Query(Parse.Role)
        .equalTo("name", RoleList.Kiosk)
        .first();

    var query = new Parse.Query(Parse.User)
        .include("roles")
        .notEqualTo("roles", kioskRole);

    query = Restful.Filter(query, data.inputType);

    return Restful.Pagination(query, data.inputType);
});

}

import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator]
});


/// C: create users ///////////////////////
type InputC = Restful.InputC<IUser<any>>;
type OutputC = Restful.OutputC<IUser<any>>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Users
    var user = new Parse.User();
    var roles = data.inputType.roles;

    /// 2) Check Role
    var roleNames: RoleList[] = data.inputType.roles;
    for (var role of roleNames)
        if (role === RoleList.Kiosk)
            throw Errors.throw(Errors.CustomInvalid, [`Role <${getEnumKey(RoleList, role)}> not available.`]); 

    /// 3) Signup Users
    user = await user.signUp({
        ...data.inputType,
        roles: undefined
    }, { useMasterKey: true });

    /// 4) Add to Role
    var roleAry = [];
    for (var name of roleNames) {
        var r = await new Parse.Query(Parse.Role)
            .equalTo("name", name)
            .first();
        r.getUsers().add(user);
        r.save(null, {useMasterKey: true});
        roleAry.push(r);
    }

    /// 5) Add Role to User
    user.set("roles", roleAry);
    await user.save(null, { useMasterKey: true });

    return ParseObject.toOutputJSON(user);
});
///////////////////////////////////////////


/// R: get users //////////////////////////
type InputR = Restful.InputR<IUser<any>>;
type OutputR = Restful.OutputR<IUser<any>>;

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
///////////////////////////////////////////


/// U: modify users ///////////////////////
type InputU = Restful.InputU<IUser<any>>;
type OutputU = Restful.OutputU<IUser<any>>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    var { objectId } = data.inputType;

    var kioskRole = await new Parse.Query(Parse.Role)
        .equalTo("name", RoleList.Kiosk)
        .first();

    /// 1) Get User
    var user = await new Parse.Query(Parse.User)
        .notEqualTo("roles", kioskRole)
        .get(objectId);
    if (!user) throw Errors.throw(Errors.CustomNotExists, [`User <${objectId}> not exists.`]);

    /// 2) Modify
    await user.save({
        ...data.inputType,
        /// ignore update of username, roles
        username: undefined, roles: undefined
    }, {useMasterKey: true});

    return ParseObject.toOutputJSON(user);
});
///////////////////////////////////////////

/// D: delete users ///////////////////////
type InputD = Restful.InputD<IUser<any>>;
type OutputD = Restful.OutputD<IUser<any>>;

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
///////////////////////////////////////////

export default action;

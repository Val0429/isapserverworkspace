import { Restful, Announcements, Action, RoleList, IAnnouncements, Errors, ParseObject } from "core/cgi-package";




var action = new Action({
    loginRequired: true,
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IAnnouncements>;
type OutputC = Restful.OutputC<IAnnouncements>;

action.post<InputC, OutputC>({
    inputType: "InputC",
    permission: [RoleList.Administrator, RoleList.ManagementCommitee]
}, async (data) => {
    /// 1) Create Object
    var obj = new Announcements(data.inputType);
    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IAnnouncements>;
type OutputR = Restful.OutputR<IAnnouncements>;

action.get<InputR, OutputR>({
    inputType: "InputR",
    permission: [RoleList.Administrator, RoleList.ManagementCommitee, RoleList.Resident]
}, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Announcements);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IAnnouncements>;
type OutputU = Restful.OutputU<IAnnouncements>;

action.put<InputU, OutputU>({
    inputType: "InputU",
    permission: [RoleList.Administrator, RoleList.ManagementCommitee]
}, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Announcements).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Announcements <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IAnnouncements>;
type OutputD = Restful.OutputD<IAnnouncements>;

action.delete<InputD, OutputD>({
    inputType: "InputD",
    permission: [RoleList.Administrator, RoleList.ManagementCommitee]
}, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Announcements).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Announcements <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

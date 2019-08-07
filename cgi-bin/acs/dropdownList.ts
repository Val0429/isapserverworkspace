import {
    Action, Errors, Restful, ParseObject
} from 'core/cgi-package';

import { IDropDownList, DropDownList } from '../../custom/models'

var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.User]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IDropDownList>;
type OutputC = Restful.OutputC<IDropDownList>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new DropDownList(data.inputType);
    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IDropDownList>;
type OutputR = Restful.OutputR<IDropDownList>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(DropDownList);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IDropDownList>;
type OutputU = Restful.OutputU<IDropDownList>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(DropDownList).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`DropDownList <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IDropDownList>;
type OutputD = Restful.OutputD<IDropDownList>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(DropDownList).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`DropDownList <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

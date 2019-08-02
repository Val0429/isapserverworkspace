import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';
import { FRSs, IFRSs } from 'workspace/custom/models/frss';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IFRSs>;
type OutputC = Restful.OutputC<IFRSs>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new FRSs(data.inputType);
    await obj.save(null, { useMasterKey: true });

    /// V1.1) update FRS
    FRSs.update(obj);

    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IFRSs>;
type OutputR = Restful.OutputR<IFRSs>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(FRSs);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IFRSs>;
type OutputU = Restful.OutputU<IFRSs>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(FRSs).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`FRSs <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });

    /// V2.1) update FRS
    FRSs.update(obj);

    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IFRSs>;
type OutputD = Restful.OutputD<IFRSs>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(FRSs).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`FRSs <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });

    /// V2.1) delete FRS
    FRSs.delete(obj);

    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

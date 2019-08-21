import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, IUserKioskData,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import * as shortid from 'shortid';

import {
    Flow2Buildings, IFlow2Buildings
} from 'workspace/custom/models';

type IBuildings = IFlow2Buildings;
let Buildings = Flow2Buildings;
type Buildings = Flow2Buildings;

var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IBuildings>;
type OutputC = Restful.OutputC<IBuildings>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new Buildings(data.inputType);
    await obj.save(null, { useMasterKey: true });

    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IBuildings>;
type OutputR = Restful.OutputR<IBuildings>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// V1) Make Query
    var query = new Parse.Query(Buildings)
        .include("floor");
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IBuildings>;
type OutputU = Restful.OutputU<IBuildings>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Buildings).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Buildings <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IBuildings>;
type OutputD = Restful.OutputD<IBuildings>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Buildings).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Buildings <${objectId}> not exists.`]);

    /// 2) Delete
    obj.destroy({ useMasterKey: true });

    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

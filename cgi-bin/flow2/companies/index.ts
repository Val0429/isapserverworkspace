import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, IUserKioskData,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject, EventFlow2CompanyAdd, Events, EventFlow2CompanyEdit, EventFlow2CompanyRemove,
} from 'core/cgi-package';

import * as shortid from 'shortid';

import {
    Flow2Companies, IFlow2Companies
} from 'workspace/custom/models';

type ICompanies = IFlow2Companies;
let Companies = Flow2Companies;
type Companies = Flow2Companies;

var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
// /********************************
//  * C: create object
//  ********************************/
// type InputC = Restful.InputC<ICompanies>;
// type OutputC = Restful.OutputC<ICompanies>;

// action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
//     /// 1) Create Object
//     var obj = new Companies(data.inputType);
//     await obj.save(null, { useMasterKey: true });

//     var ev = new EventFlow2CompanyAdd({
//         owner: data.user,
//         company: obj
//     });
//     Events.save(ev);

//     /// 2) Output
//     return ParseObject.toOutputJSON(obj);
// });

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<ICompanies>;
type OutputR = Restful.OutputR<ICompanies>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// V1) Make Query
    var query = new Parse.Query(Companies)
        .include("floor");
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

// /********************************
//  * U: update object
//  ********************************/
// type InputU = Restful.InputU<ICompanies>;
// type OutputU = Restful.OutputU<ICompanies>;

// action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
//     /// 1) Get Object
//     var { objectId } = data.inputType;
//     var obj = await new Parse.Query(Companies).get(objectId);
//     if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Companies <${objectId}> not exists.`]);
//     /// 2) Modify
//     await obj.save({ ...data.inputType, objectId: undefined });

//     var ev = new EventFlow2CompanyEdit({
//         owner: data.user,
//         company: obj
//     });
//     Events.save(ev);

//     /// 3) Output
//     return ParseObject.toOutputJSON(obj);
// });

// /********************************
//  * D: delete object
//  ********************************/
// type InputD = Restful.InputD<ICompanies>;
// type OutputD = Restful.OutputD<ICompanies>;

// action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
//     /// 1) Get Object
//     var { objectId } = data.inputType;
//     var obj = await new Parse.Query(Companies).get(objectId);
//     if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Companies <${objectId}> not exists.`]);

//     var ev = new EventFlow2CompanyRemove({
//         owner: data.user,
//         name: obj.get("name")
//     });
//     Events.save(ev);

//     /// 2) Delete
//     obj.destroy({ useMasterKey: true });

//     /// 3) Output
//     return ParseObject.toOutputJSON(obj);
// });
/// CRUD end ///////////////////////////////////

export default action;

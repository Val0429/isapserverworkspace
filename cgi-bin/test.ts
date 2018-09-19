import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, registerSubclass,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

// export interface IPackageDate {
//     start: Date;
//     end: Date;
// }

// export interface IPackage {
//     name: string;
//     number: number;
//     address: string;
//     arrivalDate?: IPackageDate;
// }

// @registerSubclass() export class Package extends ParseObject<IPackage> {}



var action = new Action({
    loginRequired: false
});

action.get( () => {
    return "";
});

export default action;

// var action = new Action({
//     loginRequired: false,
//     permission: [RoleList.Administrator]
// });

// /// CRUD start /////////////////////////////////
// /********************************
//  * C: create object
//  ********************************/
// type InputC = Restful.InputC<IPackage>;
// type OutputC = Restful.OutputC<IPackage>;

// action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
//     /// 1) Create Object
//     var obj = new Package(data.inputType);
//     await obj.save(null, { useMasterKey: true });
//     /// 2) Output
//     return ParseObject.toOutputJSON(obj);
// });

// /********************************
//  * R: get object
//  ********************************/
// type InputR = Restful.InputR<IPackage>;
// type OutputR = Restful.OutputR<IPackage>;

// action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
//     /// 1) Make Query
//     var query = new Parse.Query(Package);
//     /// 2) With Extra Filters
//     query = Restful.Filter(query, data.inputType);
//     /// 3) Output
//     return Restful.Pagination(query, data.inputType);
// });

// /********************************
//  * U: update object
//  ********************************/
// type InputU = Restful.InputU<IPackage>;
// type OutputU = Restful.OutputU<IPackage>;

// action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
//     /// 1) Get Object
//     var { objectId } = data.inputType;
//     var obj = await new Parse.Query(Package).get(objectId);
//     if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Package <${objectId}> not exists.`]);
//     /// 2) Modify
//     await obj.save({ ...data.inputType, objectId: undefined });
//     /// 3) Output
//     return ParseObject.toOutputJSON(obj);
// });

// /********************************
//  * D: delete object
//  ********************************/
// type InputD = Restful.InputD<IPackage>;
// type OutputD = Restful.OutputD<IPackage>;

// action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
//     /// 1) Get Object
//     var { objectId } = data.inputType;
//     var obj = await new Parse.Query(Package).get(objectId);
//     if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Package <${objectId}> not exists.`]);
//     /// 2) Delete
//     obj.destroy({ useMasterKey: true });
//     /// 3) Output
//     return ParseObject.toOutputJSON(obj);
// });
// /// CRUD end ///////////////////////////////////

// export default action;

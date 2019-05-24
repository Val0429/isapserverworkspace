import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Events, IEvents,
    Restful, FileHelper, ParseObject, Employees, IEmployees, Tablets
} from 'core/cgi-package';
import { HikvisionTablet } from 'services/hikvision-tablet';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IEmployees>;
type OutputC = Restful.OutputC<IEmployees>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new Employees(data.inputType);
    await obj.save(null, { useMasterKey: true });

    /// V1.1) Enroll into Hikvision
    let { cardno, name, employeeno, image } = data.inputType;
    let buffer = await FileHelper.downloadParseFile(image);
    let tablets = await new Parse.Query(Tablets).find();
    tablets.forEach( async (tablet) => {
        let o = HikvisionTablet.getInstance(tablet.attributes);
        await o.createCard({
            cardno: cardno+"",
            employeeno: employeeno+"",
            name
        });
        await o.enrollFace({
            cardno: cardno+"",
            facelen: buffer.length,
            buffer
        });
    });

    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IEmployees>;
type OutputR = Restful.OutputR<IEmployees>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Employees);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IEmployees>;
type OutputU = Restful.OutputU<IEmployees>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Employees).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Employees <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IEmployees>;
type OutputD = Restful.OutputD<IEmployees>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Employees).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Employees <${objectId}> not exists.`]);

    /// V1.1) Remove from Hikvision
    let { cardno } = obj.attributes;
    let tablets = await new Parse.Query(Tablets).find();
    tablets.forEach( async (tablet) => {
        let o = HikvisionTablet.getInstance(tablet.attributes);
        await o.removeCard({
            cardno: cardno+""
        });
    });

    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

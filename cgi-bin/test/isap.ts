import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Restful, registerSubclass, ParseObject, EventLogout,
} from 'core/cgi-package';

enum iSAPOpt {
    Enable,
    Disable
}

interface IiSAP {
    account: string;
    password: string;
    enable: boolean;
    startdate: Date;
    enddate?: Date;
    option: iSAPOpt;
}
@registerSubclass() export class iSAP extends ParseObject<IiSAP> {}



var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IiSAP>;
type OutputC = Restful.OutputC<IiSAP>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new iSAP(data.inputType);
    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IiSAP>;
type OutputR = Restful.OutputR<IiSAP>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(iSAP);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IiSAP>;
type OutputU = Restful.OutputU<IiSAP>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(iSAP).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`iSAP <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IiSAP>;
type OutputD = Restful.OutputD<IiSAP>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(iSAP).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`iSAP <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

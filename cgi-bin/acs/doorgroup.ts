import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';

import { Log } from 'helpers/utility';
import { IDoorGroup, DoorGroup } from '../../custom/models'


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "5-2_door_doorgroup_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IDoorGroup>;
type OutputC = Restful.OutputC<IDoorGroup>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new DoorGroup(data.inputType);
    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    Log.Info(`${this.constructor.name}`, `postDoorGroup ${data.inputType.groupid} ${data.inputType.groupname}`);

    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IDoorGroup>;
type OutputR = Restful.OutputR<IDoorGroup>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(DoorGroup)
        .include("area.site")
        .include("doors");
    let filter = data.parameters as any;
    if(filter.name){
        query.matches("groupname", new RegExp(filter.name), "i");
    }
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IDoorGroup>;
type OutputU = Restful.OutputU<IDoorGroup>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(DoorGroup).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`DoorGroup <${objectId}> not exists.`]);
    /// 2) Modify
    Log.Info(`${this.constructor.name}`, `putDoorGroup ${obj.get("groupid")} ${obj.get("groupname")}`);

    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IDoorGroup>;
type OutputD = Restful.OutputD<IDoorGroup>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(DoorGroup).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`DoorGroup <${objectId}> not exists.`]);

    Log.Info(`${this.constructor.name}`, `deleteDoorGroup ${obj.get("groupid")} ${obj.get("groupname")}`);

    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

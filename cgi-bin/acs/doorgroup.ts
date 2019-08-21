import {
    Action, Errors, Restful, ParseObject
} from 'core/cgi-package';

import { Log } from 'workspace/custom/services/log';
import { IDoorGroup, DoorGroup } from '../../custom/models'


var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "door_doorgroup_CRUD"
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
    Log.Info(`info`, `postDoorGroup ${data.inputType.groupname}`, data.user, false);

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
        .ascending("groupname")
        .include("doors.readerin")
        .include("doors.readerout");
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
    Log.Info(`info`, `putDoorGroup ${obj.get("groupname")}`, data.user, false);

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

    Log.Info(`info`, `deleteDoorGroup ${obj.get("groupname")}`, data.user, false);

    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

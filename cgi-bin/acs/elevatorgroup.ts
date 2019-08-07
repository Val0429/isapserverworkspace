import {
    Action, Errors, Restful, ParseObject
} from 'core/cgi-package';
import { Log } from 'workspace/custom/services/log';
import { IElevatorGroup, ElevatorGroup } from '../../custom/models'


var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "door_elevatorgroup_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IElevatorGroup>;
type OutputC = Restful.OutputC<IElevatorGroup>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new ElevatorGroup(data.inputType);

    Log.Info(`${this.constructor.name}`, `postElevatorGroup ${data.inputType.groupid} ${data.inputType.groupname}`);

    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IElevatorGroup>;
type OutputR = Restful.OutputR<IElevatorGroup>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(ElevatorGroup)
        .include("elevators")
        .include("area.site");
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
type InputU = Restful.InputU<IElevatorGroup>;
type OutputU = Restful.OutputU<IElevatorGroup>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(ElevatorGroup).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`ElevatorGroup <${objectId}> not exists.`]);

    Log.Info(`${this.constructor.name}`, `putElevatorGroup ${obj.get("groupid")} ${obj.get("groupname")}`);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IElevatorGroup>;
type OutputD = Restful.OutputD<IElevatorGroup>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(ElevatorGroup).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`ElevatorGroup <${objectId}> not exists.`]);

    Log.Info(`${this.constructor.name}`, `deleteElevatorGroup ${obj.get("groupid")} ${obj.get("groupname")}`);

    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

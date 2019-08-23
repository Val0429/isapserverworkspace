import {
    Action, Errors, Restful, ParseObject
} from 'core/cgi-package';

import { Log } from 'workspace/custom/services/log';
import { IFloorGroup, FloorGroup } from '../../custom/models'


var action = new Action({
    loginRequired: true,
    apiToken:"door_floorgroup_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IFloorGroup>;
type OutputC = Restful.OutputC<IFloorGroup>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new FloorGroup(data.inputType);

    
    await obj.save(null, { useMasterKey: true });
    await Log.Info(`create`, `${data.inputType.groupname}`, data.user, false, "FloorGroup");

    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IFloorGroup>;
type OutputR = Restful.OutputR<IFloorGroup>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(FloorGroup)
                .ascending("groupname")
                .include("floors");
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
type InputU = Restful.InputU<IFloorGroup>;
type OutputU = Restful.OutputU<IFloorGroup>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(FloorGroup).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`FloorGroup <${objectId}> not exists.`]);
    
    
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    await Log.Info(`update`, `${obj.get("groupname")}`, data.user, false, "FloorGroup");

    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IFloorGroup>;
type OutputD = Restful.OutputD<IFloorGroup>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(FloorGroup).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`FloorGroup <${objectId}> not exists.`]);
    
    
    /// 2) Delete
    await obj.destroy({ useMasterKey: true });
    await Log.Info(`delete`, `${obj.get("groupname")}`, data.user, false, "FloorGroup");
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

import {
    Action, Errors, Restful, ParseObject
} from 'core/cgi-package';

import { Log } from 'workspace/custom/services/log';
import { ITimeSchedule, TimeSchedule } from '../../custom/models'


var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<ITimeSchedule>;
type OutputC = Restful.OutputC<ITimeSchedule>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new TimeSchedule(data.inputType);

    Log.Info(`info`, `postTimeSchedule ${data.inputType.timeid} ${data.inputType.timename}`, data.user, false);

    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<ITimeSchedule>;
type OutputR = Restful.OutputR<ITimeSchedule>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(TimeSchedule)
                .ascending("timename");
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    query.equalTo("system", 1);

    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<ITimeSchedule>;
type OutputU = Restful.OutputU<ITimeSchedule>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(TimeSchedule).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`TimeSchedule <${objectId}> not exists.`]);

    Log.Info(`info`, `putTimeSchedule ${obj.get("timeid")} ${obj.get("timename")}`, data.user, false);

    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<ITimeSchedule>;
type OutputD = Restful.OutputD<ITimeSchedule>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(TimeSchedule).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`TimeSchedule <${objectId}> not exists.`]);

    Log.Info(`info`, `deleteTimeSchedule ${obj.get("timeid")} ${obj.get("timename")}`, data.user, false);

    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

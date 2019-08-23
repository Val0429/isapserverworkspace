import {
    Action, Errors, Restful, ParseObject
} from 'core/cgi-package';

import { ISyncNotification, SyncNotification } from '../../custom/models'
import { Log } from 'workspace/custom/services/log';


var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "notification_sync_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<ISyncNotification>;
type OutputC = Restful.OutputC<ISyncNotification>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new SyncNotification(data.inputType);
    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    let message = ParseObject.toOutputJSON(obj);
    await Log.Info(`create`, `${message.receivers.map(x=>x.receivename).join(", ")}`, data.user, false,"SyncReceiver");
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<ISyncNotification>;
type OutputR = Restful.OutputR<ISyncNotification>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(SyncNotification);
    
    let filter = data.parameters as any;
    if(filter.name){
        query.matches("receivers.receivename", new RegExp(filter.name), "i");
    }
    if(filter.email){
        query.matches("receivers.emailaddress", new RegExp(filter.email), "i");
    }
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<ISyncNotification>;
type OutputU = Restful.OutputU<ISyncNotification>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(SyncNotification).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`SyncNotification <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    let message = ParseObject.toOutputJSON(obj);
    await Log.Info(`update`, `${message.receivers.map(x=>x.receivename).join(", ")}`, data.user, false,"SyncReceiver");
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<ISyncNotification>;
type OutputD = Restful.OutputD<ISyncNotification>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(SyncNotification).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`SyncNotification <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    let message = ParseObject.toOutputJSON(obj);
    await Log.Info(`delete`, `${message.receivers.map(x=>x.receivename).join(", ")}`, data.user, false,"SyncReceiver");
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

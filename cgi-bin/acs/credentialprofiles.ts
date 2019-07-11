import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject, TimeSchedule, Door
} from 'core/cgi-package';

import { Log } from 'helpers/utility';
import { ICredentialProfiles, CredentialProfiles } from '../../custom/models'


var action = new Action({
    loginRequired: false,
    permission: [RoleList.Admin]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
// type InputC = Restful.InputC<ICredentialProfiles>;
// type OutputC = Restful.OutputC<ICredentialProfiles>;

// action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
//     /// 1) Create Object
//     var obj = new CredentialProfiles(data.inputType);
//     await obj.save(null, { useMasterKey: true });
//     /// 2) Output
//     return ParseObject.toOutputJSON(obj);
// });

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<ICredentialProfiles>;
type OutputR = Restful.OutputR<ICredentialProfiles>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(CredentialProfiles);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
// type InputU = Restful.InputU<ICredentialProfiles>;
// type OutputU = Restful.OutputU<ICredentialProfiles>;

// action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
//     /// 1) Get Object
//     var { objectId } = data.inputType;
//     var obj = await new Parse.Query(CredentialProfiles).get(objectId);
//     if (!obj) throw Errors.throw(Errors.CustomNotExists, [`CredentialProfiles <${objectId}> not exists.`]);
//     /// 2) Modify
//     await obj.save({ ...data.inputType, objectId: undefined });
//     /// 3) Output
//     return ParseObject.toOutputJSON(obj);
// });

/********************************
 * D: delete object
 ********************************/
// type InputD = Restful.InputD<ICredentialProfiles>;
// type OutputD = Restful.OutputD<ICredentialProfiles>;

// action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
//     /// 1) Get Object
//     var { objectId } = data.inputType;
//     var obj = await new Parse.Query(CredentialProfiles).get(objectId);
//     if (!obj) throw Errors.throw(Errors.CustomNotExists, [`CredentialProfiles <${objectId}> not exists.`]);
//     /// 2) Delete
//     obj.destroy({ useMasterKey: true });
//     /// 3) Output
//     return ParseObject.toOutputJSON(obj);
// });
/// CRUD end ///////////////////////////////////

export default action;

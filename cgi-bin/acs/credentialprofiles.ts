import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject, TimeSchedule, Door
} from 'core/cgi-package';

import { Log } from 'workspace/custom/services/log';
import { ICredentialProfiles, CredentialProfiles } from '../../custom/models'


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin]
});

/// CRUD start /////////////////////////////////
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
/// CRUD end ///////////////////////////////////

export default action;

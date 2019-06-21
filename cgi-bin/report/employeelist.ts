import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';

import { IvieMember, vieMember } from 'workspace/custom/models/index';


var action = new Action({
    loginRequired: true,
    postSizeLimit: 1024*1024*10,
    permission: [RoleList.Admin, RoleList.User]
});



/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IvieMember>;
type OutputR = Restful.OutputR<IvieMember>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(vieMember);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.inputType);
});


export default action;

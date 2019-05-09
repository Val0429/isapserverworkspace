import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, Config,
    Action, Errors, Person, ParseObject, FileHelper,
    Events, IPurposes, Purposes, Restful
} from 'core/cgi-package';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Kiosk]
});

/// CRUD start /////////////////////////////////
/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IPurposes>;
type OutputR = Restful.OutputR<IPurposes>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Purposes);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});
/// CRUD end ///////////////////////////////////

export default action;

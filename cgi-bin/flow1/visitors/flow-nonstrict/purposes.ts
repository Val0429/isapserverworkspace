import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, Config,
    Action, Errors, Person, ParseObject, FileHelper,
    Events, Restful, Flow1Purposes, IFlow1Purposes
} from 'core/cgi-package';

type Purposes = Flow1Purposes;
let Purposes = Flow1Purposes;
type IPurposes = IFlow1Purposes;

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

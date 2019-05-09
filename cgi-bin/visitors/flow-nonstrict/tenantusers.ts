import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, Config,
    Action, Errors, Person, ParseObject, FileHelper,
    Events, ICompanies, Companies, Restful
} from 'core/cgi-package';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Kiosk]
});

/// CRUD start /////////////////////////////////
/********************************
 * R: get object
 ********************************/
interface InputRTenantUsers {
    company: Companies;
}
type InputR = Restful.InputR<{}> & InputRTenantUsers;
type OutputR = Restful.OutputR<Parse.User>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Parse.User);
    
    /// V2) Filter
    let role = await new Parse.Query(Parse.Role)
        .equalTo("name", RoleList.TenantUser)
        .first();
    query = query.equalTo("roles", role).equalTo("data.company.objectId", data.inputType.company.id);

    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});
/// CRUD end ///////////////////////////////////

export default action;
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
type InputR = Restful.InputR<ICompanies>;
interface OutputRCompanies {
    floor: number;
    companies: Companies[];
}
type OutputR = Restful.OutputR<OutputRCompanies>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Companies);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    
    /// V2.1) Aggregation
    query.include("floor");
    let results = await query.find();
    let rtn: OutputRCompanies[] = [];
    for (let company of results) {
        let attrs = company.attributes;
        for (let floor of attrs.floor) {
            let fattrs = floor.attributes;
            let floornum = fattrs.floor;
            let floorobj = rtn[floornum] || ( rtn[floornum] = { floor: floornum, companies: [] } );
            floorobj.companies.push(company);
        }
    }
    rtn = rtn.filter(v => v);

    /// 3) Output
    return Restful.Pagination(rtn, data.parameters);
});
/// CRUD end ///////////////////////////////////

export default action;

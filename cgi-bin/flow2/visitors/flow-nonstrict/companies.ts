import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, IUserKioskData,
    Action, Errors, UserType,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import * as shortid from 'shortid';

import {
    Flow2Companies, IFlow2Companies, Flow2Buildings
} from 'workspace/custom/models';

type ICompanies = IFlow2Companies;
let Companies = Flow2Companies;
type Companies = Flow2Companies;

type Buildings = Flow2Buildings;
let Buildings = Flow2Buildings;

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Kiosk]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<ICompanies>;
type OutputC = Restful.OutputC<ICompanies>;

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<ICompanies>;
type OutputR = Restful.OutputR<ICompanies>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    let kiosk: UserType<RoleList.Kiosk> = data.user.attributes;
    let buildingId = kiosk.data.building.id;

    /// V1) Make Query
    var query = new Parse.Query(Companies)
        .include("floor")
        .include("floor.building");
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);

    let result = await query.find();
    result = result.filter((value, index) => {
        for (let floor of value.getValue("floor")) {
            if (floor.getValue("building").id === buildingId) return true;
        }
        return false;
    });

    /// 3) Output
    return Restful.Pagination(result, data.parameters);
});
/// CRUD end ///////////////////////////////////

export default action;

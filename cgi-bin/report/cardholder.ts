import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject, TimeSchedule
} from 'core/cgi-package';

import { IMember, Member, AccessLevel } from '../../custom/models'


var action = new Action({
    loginRequired: false,
    permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "2-2_report_door_R"
});


/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IMember>;
type OutputR = Restful.OutputR<IMember>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    let pageSize = Number.MAX_SAFE_INTEGER;

    let times = await new Parse.Query(TimeSchedule).find();

    /// 1) Make Query
    var query = new Parse.Query(Member);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);

    let rs = await query.limit(pageSize).find();

    for (let i = 0; i < rs.length; i++) {
        let r = rs[i];

        let rules = r.get("AccessRules");

        if ( rules.length >= 1) {
            for (let j = 0; j < rules.length; j++) {
                let ru = rules[j];
                for (let k = 0; k < times.length; k++) {
                    if (ru["TimeScheduleToken"] == times[k].get("timeid") )
                        ru["TimeScheduleToken"] = times[k];
                }
            }
        }
    }

    /// 3) Output
    return Restful.Pagination(rs, data.parameters);
});

export default action;
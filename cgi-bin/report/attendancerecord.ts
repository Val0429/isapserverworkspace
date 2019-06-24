import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';

import { IAttendanceRecords, AttendanceRecords, Member } from 'workspace/custom/models/index';
import { last } from 'rxjs/operator/last';


var action = new Action({
    loginRequired: false,
    postSizeLimit: 1024 * 1024 * 10,
    permission: [RoleList.Admin, RoleList.User]
});



/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IAttendanceRecords>;
type OutputR = Restful.OutputR<IAttendanceRecords>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    let pageSize = Number.MAX_SAFE_INTEGER;

    /// 1) Make Query
    let query = new Parse.Query(AttendanceRecords);

    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType)
        .addAscending("card_no").addAscending("date_occurred").addAscending("time_occurred");

    let records = [];
    let rs = await query.limit(pageSize).find();

    let lr = null;
    if (rs.length >= 1) {
        lr = rs[0];
        records.push(lr);
    }

    for (let i = 1; i < rs.length; i++) {
        let r = rs[i];

        if (r.get("card_no") != lr.get("card_no")) {
            records.push(lr);
            records.push(r);
        }
        else {
            if (r.get("date_occurred") != lr.get("date_occurred")) {
                records.push(lr);
                records.push(r);
            }
        }
        lr = r ;
    }
    records.push(lr);

    let members = await new Parse.Query(Member).limit(pageSize).find();

    for (let i = 0; i < records.length; i++) {
        let r = records[i];

        for (let j = 0; j < members.length; j++) {
            let m = members[j];

            let cred = m.get("Credentials");

            if (cred.length >= 1) {
                if (cred[0]["CardNumber"] == r.get("card_no")) {
                    m["Potrait"] = undefined ;
                    m["CardholderPortrait"] = undefined ;
                    r.set("member", m);
                }
            }
        }
    }

    /// 3) Output
    return Restful.Pagination(records, data.inputType);
});


export default action;

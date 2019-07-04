import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';

import { IAttendanceRecords, AttendanceRecords, Member } from 'workspace/custom/models/index';
import { last } from 'rxjs/operator/last';
import moment = require('moment');


var action = new Action({
    loginRequired: false,
    postSizeLimit: 1024 * 1024 * 10,
    permission: [RoleList.Admin, RoleList.User],
    apiToken: "2-7_report_attendance_R"
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
        .addAscending("card_no")
        .addAscending("date_occurred")
        .addAscending("time_occurred");
    
    let filter = data.parameters as any;
    if(filter.card_no){
        query.equalTo("card_no", filter.card_no);
    }

    let records = [];
    let rs = await query.limit(pageSize).find();

    let lr = null;
    if (rs.length >= 1) {
        lr = rs[0];
        
        let dateTime = lr.get("date_occurred")+lr.get("time_occurred");
        
        lr.set("date_time_occured", moment(dateTime, 'YYYYMMDDHHmmss').toDate());
        console.log(lr.get("date_time_occured"));
        records.push(lr);
    }

    for (let i = 1; i < rs.length; i++) {
        let r = rs[i];
        let dateTime = r.get("date_occurred")+r.get("time_occurred")
        
        r.set("date_time_occured", moment(dateTime, 'YYYYMMDDHHmmss').toDate());
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
    
    if(filter.start){
        let start = new Date(filter.start);
        records.filter(x=>x.date_time_occured >= start);
    }
    if(filter.end){
        let end= new Date(filter.end);
        records.filter(x=>x.date_time_occured <= end);
    }

    /// 3) Output
    return Restful.Pagination(records, data.inputType);
});


export default action;

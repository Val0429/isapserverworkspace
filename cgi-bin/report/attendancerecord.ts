import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    Restful, FileHelper, ParseObject, Door
} from 'core/cgi-package';

import { IAttendanceRecords, AttendanceRecords, Member } from 'workspace/custom/models/index';
import { last } from 'rxjs/operator/last';
import moment = require('moment');


var action = new Action({
    loginRequired: false,
    postSizeLimit: 1024 * 1024 * 10,
    // permission: [RoleList.Admin, RoleList.User],
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
        .exists("card_no")
        .notEqualTo("card_no", "")
        .addAscending("card_no")
        .addAscending("date_occurred")
        .addAscending("time_occurred");

    let filter = data.parameters as any;
    if (filter.CardNumber) {
        query.matches("card_no", new RegExp(filter.CardNumber), "i");
    }
    if (filter.start) {
        let start = new Date(filter.start);        
        query.greaterThanOrEqualTo("date_time_occurred", start);
    }
    if (filter.end) {
        let end = new Date(filter.end);
        query.lessThanOrEqualTo("date_time_occurred", end);
    }
    let results = [];
    let records = await query.limit(pageSize).find();
    
    for(let record of records.map(x=>ParseObject.toOutputJSON(x))){
        if (!record.date_occurred || !record.date_time_occurred) continue;        
        let thisDayRecords = results.filter(x=>x.date_occurred == record.date_occurred && x.card_no == record.card_no);
        let at_id = await new Parse.Query(Door).equalTo("doorid", record.at_id).first();
        if(at_id)  record.at_id = at_id.get('doorname');
        //start, assume in and out at the same time
        if(thisDayRecords.length<2){
            results.push(Object.assign({},record));
            results.push(Object.assign({},record));
        }
        //update out / end record
        else {            
            for(const key of Object.keys(record)){
                thisDayRecords[1][key] = record[key];
            }            
        } 
        
    }

    /// 3) Output
    return {
        paging:{
            page:1,
            pageSize,
            total:results.length,
            totalPages:Math.ceil(results.length / pageSize)
        },
        results
    };
});


export default action;

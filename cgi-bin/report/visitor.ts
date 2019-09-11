import { Action, Restful, ParseObject} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';
import moment = require('moment');


var action = new Action({
    loginRequired: true,
    apiToken: "report_visitor_R"
});



/********************************
 * R: get object
 ********************************/
action.post(async (data) => {
    
    let reportService = new ReportService();
    let filter = data.parameters as any;
    let pageSize = filter.paging.pageSize || 10;
    let page = filter.paging.page || 1;
    let fields = filter.selectedColumns.map(x=>"member."+x.key);
    fields.push("attendanceStart.door.doorname");
    fields.push("attendanceEnd.door.doorname");
    fields.push("attendanceEnd.date_time_occurred");
    fields.push("attendanceStart.date_time_occurred");
    let dailyQuery = reportService.getDailyAttendanceQuery(filter, pageSize, (page-1)*pageSize);
    console.log("filter", filter);    
    dailyQuery.select(...fields);
    let total = await dailyQuery.count();
    let oData = await dailyQuery.find();
    let results = oData.map(x=>ParseObject.toOutputJSON(x));
    for(let item of results){
        let start = item.attendanceStart;
        let end = item.attendanceEnd;
        let newMember = item.member;
        delete(newMember.objectId);
        
        //merge fields
        Object.assign(item, newMember);
        item.at_id = start.door.doorname;
        item.at_id_end = end.door.doorname;

        let timeStart = moment(start.date_time_occurred);
        let timeEnd = moment(end.date_time_occurred);
        item.startTime = timeStart.format("HH:mm:ss");
        item.dateOccurred = timeStart.format("YYYY-MM-DD");
        item.endTime = timeEnd.format("HH:mm:ss");
        item.workTime = moment.utc(timeEnd.diff(timeStart)).format("H[h ]m[m ]s[s]");
        
        delete(item.member);
        delete(item.atendanceStart);
        delete(item.atendanceEnd);
    }
    /// 3) Output
    return {
        paging:{
            page:1,
            pageSize,
            total,
            totalPages:Math.ceil(total / pageSize)
        },
        results
    };
});


export default action;

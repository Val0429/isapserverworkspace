import { Action, Restful, ParseObject, Log} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';
import MemberService from 'workspace/custom/services/member-service';
import moment = require('moment');
import { AttendanceRecords, DailyAttendance } from "workspace/custom/models";
import { LinearMember } from "workspace/custom/models/access-control";

var action = new Action({
    loginRequired: true,
    apiToken: "report_demographic_R"
});



/********************************
 * R: get object
 ********************************/

action.post(async (data) => {
    let reportService = new ReportService();
    let memberService = new MemberService();
    let filter = data.parameters as any;
    let pageSize = filter.paging.pageSize || 10;
    let page = filter.paging.page || 1;
    let fields = filter.selectedColumns.map(x=>x.key);
    fields.push("objectId");
    fields.push("dateOccurred");
    fields.push("member.objectId");
    fields.push("attendanceEnd.date_time_occurred");
    fields.push("attendanceStart.date_time_occurred");
    // var tt = Log.InfoTime("Test", "1");
    let dailyQuery = reportService.getDailyAttendanceQuery(filter, Number.MAX_SAFE_INTEGER, 0);
    console.log("filter", filter);    
    dailyQuery.select(...fields);
    
    let memberQuery = memberService.getMemberQuery(filter)
                        .select(...fields)
                        .limit(pageSize)
                        .skip((page-1)*pageSize);

    let bb = await memberQuery.find();

    //dailyQuery.matchesQuery("member", memberQuery);

    let oMembers = await memberQuery.find();
    let total = await memberQuery.count();
    let members = oMembers.map(x=>ParseObject.toOutputJSON(x));

  

    for (let member of members) {
        if (!member.inOutDailyCount) member.inOutDailyCount = 0;
        let mem = new LinearMember();
        mem.id = member.objectId;
        if(member.startDate)member.startDate=moment(member.startDate).format("YYYY-MM-DD");
        if(member.endDate)member.endDate=moment(member.endDate).format("YYYY-MM-DD");
        let attendances = await dailyQuery.equalTo("member", mem).find();
        if(!attendances)continue;
        for(let attendance of attendances){
            if(member.lastDateOccured !== attendance.attributes.dateOccurred){
                member.lastDateOccured = attendance.attributes.dateOccurred;
                member.inOutDailyCount +=1;  
            }
        }
    }
    
    /// 3) Output
    return {
        paging:{
            page,
            pageSize,
            total,
            totalPages:Math.ceil(total / pageSize)
        },
        results:members
    };
});


export default action;

import { Action, Restful, ParseObject} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';
import moment = require('moment');
import MemberService from 'workspace/custom/services/member-service';


var action = new Action({
    loginRequired: true,
    apiToken: "report_contractor_R"
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
    let dailyQuery = reportService.getDailyAttendanceQuery(filter, Number.MAX_SAFE_INTEGER, 0);
    console.log("filter", filter);    
    dailyQuery.select(...fields);
    
    let memberQuery = memberService.getMemberQuery(filter)
                        .select(...fields)
                        .limit(pageSize)
                        .skip((page-1)*pageSize);
    dailyQuery.matchesQuery("member", memberQuery);

    let oMembers = await memberQuery.find();
    let total = await memberQuery.count();
    let members = oMembers.map(x=>ParseObject.toOutputJSON(x));
    let oAttendances = await dailyQuery.find();
    let attendances = oAttendances.map(x=>ParseObject.toOutputJSON(x));
    
    for(let member of members){
        if(member.startDate)member.startDate=moment(member.startDate).format("YYYY-MM-DD");
        if(member.endDate)member.endDate=moment(member.endDate).format("YYYY-MM-DD");
        if(member.month1===undefined)member.month1=0;
        if(member.month2===undefined)member.month2=0;
        if(member.month3===undefined)member.month3=0;
        let attendance = attendances.find(x=>x.member.objectId == member.objectId);
        if(!attendance)continue;
        let monthDifferent =  moment.utc(moment(filter.End).diff(moment(attendance.attendanceStart.date_time_occurred))).month();
        console.log("monthDifferent",monthDifferent, member.lastDateOccured, attendance.dateOccurred);
        if(member.lastDateOccured === attendance.dateOccurred)continue;
        member.lastDateOccured = attendance.dateOccurred;
        if(monthDifferent==0)member.month1 +=1;
        if(monthDifferent==1)member.month2 +=1;
        if(monthDifferent==2)member.month3 +=1; 
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

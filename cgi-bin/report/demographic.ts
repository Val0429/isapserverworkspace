import { Action, Restful} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';


var action = new Action({
    loginRequired: true,
    apiToken: "report_demographic_R"
});



/********************************
 * R: get object
 ********************************/

action.get(async (data) => {
    let pageSize = 10000;
    let filter = data.parameters as any;
    let reportService = new ReportService();
    let members = await reportService.getMemberRecord(filter, pageSize);
    let results = members.results;
    for(let member of results){
        member.inOutDailyCount=0;
    }
    
    let attendances = await reportService.getAttendanceRecord(filter, pageSize);
    let i=0;
    while(i<attendances.results.length){            
        let item = attendances.results[i];
        let item2 = attendances.results[i+1];
        i+=2;
        let member = results.find(x=>x.objectId == item.memberObjectId);
        if(!member|| !item2)continue;
        if(!member.inOutDailyCount)member.inOutDailyCount=0;
        if(member.lastDateOccured !== item.date_occurred){
            member.lastDateOccured = item.date_occurred;
            member.inOutDailyCount +=1;            
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

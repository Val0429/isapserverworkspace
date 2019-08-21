import { Action, Restful} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';
import moment = require('moment');


var action = new Action({
    loginRequired: true,
    apiToken: "report_contractor_R"
});



/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<any>;
type OutputR = Restful.OutputR<any>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    let pageSize = 10000;
    let filter = data.parameters as any;
    let reportService = new ReportService();
    let members = await reportService.getMemberRecord(filter, pageSize);
    let results = members.results;
    for(let member of results){
        if(!member.month1)member.month1=0;
        if(!member.month2)member.month2=0;
        if(!member.month3)member.month3=0;
    }      
    
    let attendances = await reportService.getAttendanceRecord(filter, pageSize);
    let i=0;
    while(i<attendances.results.length){            
        let item = attendances.results[i];
        let item2 = attendances.results[i+1];
        i+=2;
        let member = results.find(x=>x.objectId == item.memberObjectId);
        if(!member || !item2)continue;        
        let monthDifferent =  moment.utc(moment(filter.End).diff(moment(item.date_time_occurred))).month();
        console.log("monthDifferent",monthDifferent);
        if(member.lastDateOccured === item.date_occurred)continue;
        member.lastDateOccured = item.date_occurred;
        if(monthDifferent==0)member.month1 +=1;
        if(monthDifferent==1)member.month2 +=1;
        if(monthDifferent==2)member.month3 +=1;                
        
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

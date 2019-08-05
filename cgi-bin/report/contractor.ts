import { Action, Restful} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';
import moment = require('moment');


var action = new Action({
    loginRequired: true,
    apiToken: "2-5_report_contractor_R"
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
    let results = await reportService.getMemberRecord(filter, pageSize);
    for(let member of results){
        if(!member.Month1)member.Month1=0;
        if(!member.Month2)member.Month2=0;
        if(!member.Month3)member.Month3=0;
    }
      
   
    
    
    let attendances = await reportService.getAttendanceRecord(filter, pageSize);
    let i=0;
    while(i<attendances.length){            
        let item = attendances[i];
        let item2 = attendances[i+1];
        i+=2;
        let member = results.find(x=>x.CardNumber == item.card_no);
        if(!member || !item2)continue;
        if(!member.Month1)member.Month1=0;
        if(!member.Month2)member.Month2=0;
        if(!member.Month3)member.Month3=0;
        let monthDifferent =  moment.utc(moment(filter.End).diff(moment(item.date_time_occurred))).month();
        console.log("monthDifferent",monthDifferent);
        if(member.LastDateOccured === item.date_occurred)continue;
        member.LastDateOccured = item.date_occurred;
        if(monthDifferent==0)member.Month1 +=1;
        if(monthDifferent==1)member.Month2 +=1;
        if(monthDifferent==2)member.Month3 +=1;                
        
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

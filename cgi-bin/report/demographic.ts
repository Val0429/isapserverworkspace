import { Action, Restful} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';


var action = new Action({
    loginRequired: true,
    apiToken: "report_demographic_R"
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
        member.InOutDailyCount=0;
    }
    
    let attendances = await reportService.getAttendanceRecord(filter, pageSize);
    let i=0;
    while(i<attendances.length){            
        let item = attendances[i];
        let item2 = attendances[i+1];
        i+=2;
        let member = results.find(x=>x.CardNumber == item.card_no);
        if(!member|| !item2)continue;
        if(!member.InOutDailyCount)member.InOutDailyCount=0;
        if(member.LastDateOccured !== item.date_occurred){
            member.LastDateOccured = item.date_occurred;
            member.InOutDailyCount +=1;            
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

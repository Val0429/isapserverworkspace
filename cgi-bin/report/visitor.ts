import { Action, Restful} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';
import moment = require('moment');


var action = new Action({
    loginRequired: true,
    apiToken: "report_visitor_R"
});



/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<any>;
type OutputR = Restful.OutputR<any>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    let pageSize = 10000;

    let reportService = new ReportService();
    let attendances = await reportService.getAttendanceRecord(data.parameters as any, pageSize);
    let results=[];
    let i=0;
    while(i<attendances.length){            
        let item = attendances[i];
        let item2 = attendances[i+1];
        i+=2;
        if(!item2)continue;            
        let newItem = Object.assign(item, {CardNumber:item.card_no});
        newItem.date_time_occurred_end = item2.date_time_occurred;
        newItem.at_id_end = item2.at_id;
        let timeStart = moment(newItem.date_time_occurred);
        let timeEnd = moment(newItem.date_time_occurred_end);
        newItem.StartTime = timeStart.format("HH:mm");
        newItem.DateOccurred = timeStart.format("YYYY-MM-DD");
        newItem.EndTime = timeEnd.format("HH:mm");
        newItem.WorkTime = moment.utc(timeEnd.diff(timeStart)).format("H[h ]m[m]");
        results.push(newItem);
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

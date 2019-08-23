import { Action, Restful} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';
import moment = require('moment');


var action = new Action({
    loginRequired: true,
    apiToken: "report_attendance_R"
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
    let attendances = await reportService.getAttendanceRecord(filter, pageSize);
    let cardNumbers = attendances.results.filter(x=>x.card_no && x.card_no != "").map(x=>x.card_no)
            .filter((value, index, self) => self.indexOf(value)==index)
            .join(",");
            
    filter.CardNumbers=cardNumbers;
    let members = await reportService.getMemberRecord(filter, pageSize);

    let results=[];
    let i=0;
    while(i<attendances.results.length){
        let item = attendances.results[i];
        let item2 = attendances.results[i+1];
        i+=2;
        let member = members.results.find(x=>x.cardNumber && x.cardNumber == item.card_no);
        if(!member || !item2 || item2.card_no != item.card_no)continue;
        let newItem = Object.assign(item, member);
        newItem.date_time_occurred_end = item2.date_time_occurred;
        newItem.at_id_end = item2.at_id;
        let timeStart = moment(newItem.date_time_occurred);
        let timeEnd = moment(newItem.date_time_occurred_end);
        newItem.startTime = timeStart.format("HH:mm");
        newItem.dateOccurred = timeStart.format("YYYY-MM-DD");
        newItem.endTime = timeEnd.format("HH:mm");
        newItem.workTime = moment.utc(timeEnd.diff(timeStart)).format("H[h ]m[m]");
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
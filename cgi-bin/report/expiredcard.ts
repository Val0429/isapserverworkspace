import { Action, Restful} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';


var action = new Action({
    loginRequired: true,
    apiToken: "report_card_R"
});



/********************************
 * R: get object
 ********************************/
action.get(async (data) => {
    let pageSize = 10000;

    let reportService = new ReportService();
   
    let filter = data.parameters as any;
    let {results, total} = await reportService.getMemberRecord(filter, pageSize);

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

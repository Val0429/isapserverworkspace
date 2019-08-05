import {
    Action, Restful, IPermissionTable} from 'core/cgi-package';
import { ReportService } from 'workspace/custom/services/report-service';



var action = new Action({
    loginRequired: false,
    apiToken: "2-7_report_attendance_R"
});


/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IPermissionTable>;
type OutputR = Restful.OutputR<IPermissionTable>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    
    let pageSize=10000;
    let reportService = new ReportService();
    let results = await reportService.getPermissionRecord(data.parameters as any);

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

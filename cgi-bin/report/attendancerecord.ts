import { Action, Restful} from 'core/cgi-package';

import { IAttendanceRecords } from 'workspace/custom/models/index';
import { ReportService } from 'workspace/custom/services/report-service';


var action = new Action({
    loginRequired: false,
    postSizeLimit: 1024 * 1024 * 10,
    // permission: [RoleList.Admin, RoleList.User],
    apiToken: "2-7_report_attendance_R"
});



/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IAttendanceRecords>;
type OutputR = Restful.OutputR<IAttendanceRecords>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    let pageSize = 10000;

    let reportService = new ReportService();
    let results = await reportService.getAttendanceRecord(data.parameters as any);

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

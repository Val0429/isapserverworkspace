import {
    Action, Restful, Member} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';




var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.User]
});



/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<any>;
type OutputR = Restful.OutputR<any>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {    
    /// 2) Filter query 
    let filter = data.parameters;    
    console.log("filter", filter);
    let reportService = new ReportService();
    let results = await reportService.getMemberRecord(filter);
    
    let paging :any = {
        page: 1,
        pageSize:10000,
        total: results.length,
        totalPages: 1
    };
    return {paging, results};
});


export default action;
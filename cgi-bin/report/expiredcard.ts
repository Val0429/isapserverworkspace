import { Action, Restful, ParseObject} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';
import MemberService from 'workspace/custom/services/member-service';
import moment = require('moment');


var action = new Action({
    loginRequired: true,
    apiToken: "report_card_R"
});



/********************************
 * R: get object
 ********************************/
action.post(async (data) => {
    let memberService = new MemberService();
    let filter = data.parameters as any;
    let pageSize = filter.paging.pageSize || 10;
    let page = filter.paging.page || 1;
    let fields = filter.selectedColumns.map(x=>x.key);    

   let memberQuery = memberService.getMemberQuery(filter).skip((page-1)*pageSize).limit(pageSize)
                        .lessThanOrEqualTo("endDate", moment().format())
                        .select(...fields);
   let oMembers = await memberQuery.find();
   let total = await memberQuery.count();
   let members = oMembers.map(x=>ParseObject.toOutputJSON(x));
   

    /// 3) Output
    return {
        paging:{
            page,
            pageSize,
            total,
            totalPages:Math.ceil(total / pageSize)
        },
        results:members
    };
});


export default action;

import { Action, Restful, ParseObject, AccessLevelDoor, DoorGroup} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';
import MemberService from 'workspace/custom/services/member-service';


var action = new Action({
    loginRequired: true,
    apiToken: "report_doorgroup_R"
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
    let reportService = new ReportService();
    let newFields = reportService.getMapFields(fields);
    let query = new Parse.Query(AccessLevelDoor).exists("doorgroup")
    
    if(filter.ResignationDate){
        let memberQuery = memberService.getMemberQuery(filter);
        query.matchesQuery("member", memberQuery);
    }
                        
    if(filter.doorgroupname){
        filter.ShowEmptyCardNumber=true;
        let doorgroupQuery = new Parse.Query(DoorGroup).matches("groupname", new RegExp(filter.doorgroupname),"i")
        query.matchesQuery("doorgroup", doorgroupQuery);
    }
    
    let accesslevels = await query
                        .select(...newFields)
                        .skip((page-1)*pageSize)
                        .limit(pageSize).find();
    let total = await query.count();
    let results=[];
    for(let access of accesslevels.map(x=>ParseObject.toOutputJSON(x))){
        let newAccess: any = reportService.mapAccessRow(access);
        results.push(newAccess);
        
    }
    /// 3) Output
    return {
        paging:{
            page:1,
            pageSize,
            total:total,
            totalPages:Math.ceil(total / pageSize)
        },
        results
    };
});


export default action;



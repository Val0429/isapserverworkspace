import { Action, Restful, ParseObject, AccessLevelDoor, Door} from 'core/cgi-package';

import MemberService from 'workspace/custom/services/member-service';
import { ReportService } from 'workspace/custom/services/report-service';


var action = new Action({
    loginRequired: true,
    apiToken: "report_door_R"
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
    let query = new Parse.Query(AccessLevelDoor);
    
    if(filter.ResignationDate){
        filter.ShowEmptyCardNumber=true;
        let memberQuery = memberService.getMemberQuery(filter);
        query.matchesQuery("member", memberQuery);
    }
                        
    if(filter.doorname){
        let doorQuery = new Parse.Query(Door).matches("groupname", new RegExp(filter.doorname),"i")
        query.matchesQuery("door", doorQuery);
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
 


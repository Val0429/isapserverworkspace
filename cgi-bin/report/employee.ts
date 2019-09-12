import { Action, Restful, ParseObject} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';
import MemberService from 'workspace/custom/services/member-service';


var action = new Action({
    loginRequired: true,
    apiToken: "report_member_R"
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
    if(fields.find(x=>x=="permissionName")){
        fields.splice(fields.indexOf("permissionName"),1);
        fields.push("permissionTable.tablename")
    }
    fields.push("permissionTable.accesslevels.door.doorname");
    fields.push("permissionTable.accesslevels.doorgroup.groupname");
    fields.push("permissionTable.accesslevels.timeschedule.timename");
    let memberQuery = memberService.getMemberQuery(filter)
                        .skip((page-1)*pageSize)
                        .include("permissionTable.accesslevels.door")
                        .include("permissionTable.accesslevels.timeschedule")
                        .include("permissionTable.accesslevels.doorgroup")
                        .limit(pageSize)
                        .select(...fields);
    
    let oMember = await memberQuery.find();
    let members = oMember.map(x=>ParseObject.toOutputJSON(x));
    let total = await memberQuery.count();
    let results=[];
    
    for(let member of members){
        for(let table of member.permissionTable){            
            let newMember = Object.assign({},member);            
            for(let access of table.accesslevels){
                newMember.permissionName = table.tablename;
                newMember.timeSchedule = access.timeschedule.timename;
                newMember.doorName = access.door?access.door.doorname:'';
                newMember.doorGroupName = access.doorgroup?access.doorgroup.groupname:'';
                //no need to display multiple row for the same access level
                let exists = results.find(x=>x.permissionName == newMember.permissionName && x.timeSchedule == newMember.timeSchedule && x.doorName == newMember.doorName );
                if(!exists)results.push(newMember);
            }
            
        }
    }
    /// 3) Output
    return {
        paging:{
            page,
            pageSize,
            total,
            totalPages:Math.ceil(total / pageSize)
        },
        results
    };
});


export default action;

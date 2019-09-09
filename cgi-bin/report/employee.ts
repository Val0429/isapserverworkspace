import { Action, Restful} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';


var action = new Action({
    loginRequired: true,
    apiToken: "report_member_R"
});



/********************************
 * R: get object
 ********************************/

action.get(async (data) => {
    let pageSize = 10000;
    let filter = data.parameters as any;
    let results=[];
    let reportService = new ReportService();
    let permissions = await reportService.getPermissionRecord(filter, pageSize);
    let members = await reportService.getMemberRecord(filter, pageSize);
    for(let member of members.results){
        for(let tableid of member.permissionTable){            
            let newMember = Object.assign({},member);
            let permission = permissions.results.find(x=>x.tableid==tableid);
            if(!permission || !permission.accesslevels)continue;
            for(let access of permission.accesslevels){
                newMember.permissionName = permission.tablename;
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
            page:1,
            pageSize,
            total:results.length,
            totalPages:Math.ceil(results.length / pageSize)
        },
        results
    };
});


export default action;

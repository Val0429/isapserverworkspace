import { Action, Restful} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';


var action = new Action({
    loginRequired: true,
    apiToken: "report_member_R"
});



/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<any>;
type OutputR = Restful.OutputR<any>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    let pageSize = 10000;
    let filter = data.parameters as any;
    let results=[];
    let reportService = new ReportService();
    let permissions = await reportService.getPermissionRecord(filter, pageSize);
    let members = await reportService.getMemberRecord(filter, pageSize);
    for(let member of members){
        for(let tableid of member.PermissionTable){            
            let newMember = Object.assign({},member);
            let permission = permissions.find(x=>x.tableid==tableid);
            if(!permission || !permission.accesslevels)continue;
            for(let access of permission.accesslevels){
                newMember.PermissionName = permission.tablename;
                newMember.TimeSchedule = access.timeschedule.timename;
                newMember.DoorName = access.door?access.door.doorname:'';
                newMember.DoorGroupName = access.doorgroup?access.doorgroup.groupname:'';
                //no need to display multiple row for the same access level
                let exists = results.find(x=>x.PermissionName == newMember.PermissionName && x.TimeSchedule == newMember.TimeSchedule && x.DoorName == newMember.DoorName );
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

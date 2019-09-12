import { Action, Restful, ParseObject} from 'core/cgi-package';

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
    if(fields.find(x=>x=="permissionName")){
        fields.splice(fields.indexOf("permissionName"),1);
        fields.push("permissionTable.tablename")
    }
    fields.push("permissionTable.accesslevels.doorgroup.doors.doorname");
    fields.push("permissionTable.accesslevels.doorgroup.groupname");
    fields.push("permissionTable.accesslevels.timeschedule.timename");
    let memberQuery = memberService.getMemberQuery(filter)
                        .skip((page-1)*pageSize)
                        .include("permissionTable.accesslevels.timeschedule")
                        .include("permissionTable.accesslevels.doorgroup.doors")
                        .limit(pageSize)
                        .select(...fields);
    
    let oMember = await memberQuery.find();
    let members = oMember.map(x=>ParseObject.toOutputJSON(x));
    let total = await memberQuery.count();
    let results=[];
    
    for(let member of members){
        for(let permission of member.permissionTable){   
            for(let access of permission.accesslevels){                
                if(!access.doorgroup)continue;
                if(filter.doorgroupname && access.doorgroup.groupname.search(new RegExp(filter.doorgroupname, "i"))<0)continue;
                for(let door of access.doorgroup.doors){
                    let newMember = Object.assign({},member);
                    delete(newMember.permissionTable);
                    newMember.accessObjectId = access.objectId;
                    newMember.permissionName = permission.tablename;
                    newMember.timeSchedule = access.timeschedule.timename;
                    newMember.doorGroupName = access.doorgroup.groupname;
                    newMember.doorGroupObjectId = access.doorgroup.objectId;
                    newMember.doorName = door.doorname;
                    //no need to display multiple row for the same access level
                    let exists = results.find(x=> x.objectId == newMember.objectId && 
                                                    x.accessObjectId == newMember.accessObjectId &&                                                     
                                                    x.doorGroupObjectId == newMember.doorGroupObjectId );
                    if(!exists)results.push(newMember);
                }
                
            }
            
        }
        
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

import { Action, Restful} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';


var action = new Action({
    loginRequired: true,
    apiToken: "report_door_R"
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
    for(let member of members.results){
        for(let tableid of member.permissionTable){            
            let permission = permissions.results.find(x=>x.tableid==tableid);
            if(!permission || !permission.accesslevels)continue;
            for(let access of permission.accesslevels){                
                if(access.doorgroup){
                    for(let door of access.doorgroup.doors){
                        let newMember = Object.assign({},member);
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
                if(access.door){
                    let newMember = Object.assign({},member);
                        newMember.accessObjectId = access.objectId;
                        newMember.permissionName = permission.tablename;
                        newMember.timeSchedule = access.timeschedule.timename;
                        newMember.doorName = access.door.doorname;
                        newMember.doorObjectId = access.door.objectId;
                        //no need to display multiple row for the same access level
                        let exists = results.find(x=> x.objectId == newMember.objectId && 
                                                        x.accessObjectId == newMember.accessObjectId &&                                                     
                                                        x.doorObjectId == newMember.doorObjectId );
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
            total:results.length,
            totalPages:Math.ceil(results.length / pageSize)
        },
        results
    };
});


export default action;

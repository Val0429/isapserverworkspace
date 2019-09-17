import {
    Action, Restful, ParseObject} from 'core/cgi-package';

import { PermissionTable, PermissionTableDoor, Door, CCureClearance as CCureClearance } from '../../custom/models'
import MemberService from 'workspace/custom/services/member-service';
import { GetMigrationDataPermissionTable } from 'workspace/custom/modules/acs/ccure/Migration';


var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "door_permissiontable_CRUD"
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<any>;
type OutputR = Restful.OutputR<any>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    let paging = data.parameters.paging;
    let page = +paging.page;
    let pageSize = +paging.pageSize;
    /// 1) Make Query
    var query = new Parse.Query(CCureClearance)
                .ascending("name");
    
    let filter = data.parameters as any;
    if(filter.name){
        query.matches("name", new RegExp(filter.name), "i");
    }
    let total = await query.count();
    let oCcurePermTables = await query.limit(pageSize).skip((page-1)*pageSize).find();
    let results = oCcurePermTables.map(x=>ParseObject.toOutputJSON(x));
    let ccureQuery = new Parse.Query(PermissionTable).containedIn("tablename", results.map(x=>x.name));
    let memberService = new MemberService();
    let oMembers = await memberService.getMemberQuery({})
                        .include("permissionTable")
                        .exists("permissionTable")
                        .select("employeeNumber","department","costCenter", "chineseName", "englishName", "cardNumber","permissionTable.tablename")
                        .matchesQuery("permissionTable", ccureQuery)
                        .limit(Number.MAX_SAFE_INTEGER)
                        .find();
    let members = oMembers.map(x=>ParseObject.toOutputJSON(x));
    for(let result of results){
        result.tablename = result.name;
        delete(result.name);
        result.doors=[];
        result.members = members.filter(x=>x.permissionTable.find(x=>x.tablename == result.tablename));
        
        if(!result.data)continue;
        
        for(let accessRule of result.data){
            if(accessRule.type=="door" ){
                let isActive = Array.isArray(accessRule.devices) && accessRule.devices.find(x=>x.name.length>2 && x.name.substring(0,2)!="D_");
                if(!isActive) continue;
                result.doors.push({type:"door",doorname:accessRule.name});
            }
            if(accessRule.type=="doorGroup"){
                for(let door of accessRule.doors){
                    let isActive = Array.isArray(door.devices) && door.devices.find(x=>x.name.length>2 && x.name.substring(0,2)!="D_");
                    if(!isActive) continue;
                    result.doors.push({type:"doorGroup",doorname:door.name});
                }            
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
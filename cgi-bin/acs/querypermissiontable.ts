import {
    Action, Restful, ParseObject} from 'core/cgi-package';

import { PermissionTable, PermissionTableDoor, Door } from '../../custom/models'
import MemberService from 'workspace/custom/services/member-service';


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
    var query = new Parse.Query(PermissionTable)
                .equalTo("system", 800)
                .ascending("tablename");
    
    let filter = data.parameters as any;
    if(filter.name){
        query.matches("tablename", new RegExp(filter.name), "i");
    }
    let total = await query.count();
    let oCcurePermTables = await query.limit(pageSize).skip((page-1)*pageSize).find();
    let results = oCcurePermTables.map(x=>ParseObject.toOutputJSON(x));
    let ccureQuery = new Parse.Query(PermissionTable).containedIn("tablename", results.map(x=>x.tablename));
    let memberService = new MemberService();
    let oMembers = await memberService.getMemberQuery({})
                        .include("permissionTable")
                        .exists("permissionTable")
                        .select("employeeNumber","department","costCenter", "chineseName", "englishName", "cardNumber","permissionTable.tablename")
                        .matchesQuery("permissionTable", ccureQuery)
                        .limit(Number.MAX_SAFE_INTEGER)
                        .find();
    let members = oMembers.map(x=>ParseObject.toOutputJSON(x));
    let oCcureTables = await ccureQuery.equalTo("system",800).find();
    let ccureTables = oCcureTables.map(x=>ParseObject.toOutputJSON(x));
    let oTableDoors = await new Parse.Query(PermissionTableDoor).containedIn("permissionTableId", ccureTables.map(x=>x.tableid)).find();
    
    let tableDoors = oTableDoors.map(x=>ParseObject.toOutputJSON(x));
    
    for(let result of results){
        result.doors=[];
        result.members = members.filter(x=>x.permissionTable.find(x=>x.tablename == result.tablename));
        
        let ccureTable = ccureTables.find(x=>x.tablename==result.tablename);
        if(!ccureTable)continue;
        
        let tableDoor = tableDoors.find(x=>x.permissionTableId== ccureTable.tableid );
       // console.log("tableDoor", tableDoor,ccureTable.tableid)
        if(!tableDoor)continue;
        
        let doors = await new Parse.Query(Door).containedIn("doorid", tableDoor.doorId).find();
        result.doors=doors.map(x=>ParseObject.toOutputJSON(x))
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
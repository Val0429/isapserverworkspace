import {
    Action, Restful, ParseObject} from 'core/cgi-package';

import { PermissionTable } from '../../custom/models'


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
                .ascending("tablename");
    
    let filter = data.parameters as any;
    if(filter.name){
        query.matches("tablename", new RegExp(filter.name), "i");
    }
    let total = await query.count();
    let oCcurePermTables = await query.limit(pageSize).skip((page-1)*pageSize).find();
    
    let oSipassPermTables = await new Parse.Query(PermissionTable)                           
                .include("accesslevels.door")
                .include("accesslevels.doorgroup.doors")
            .equalTo("system", 0)
            .containedIn("tablename", oCcurePermTables.map(x=>x.get("tablename")) )
            .find();
    let sipassPermTables = oSipassPermTables.map(x=>ParseObject.toOutputJSON(x));
    let results=[];
    for(let item of oCcurePermTables){
        let perm = ParseObject.toOutputJSON(item);
        let sipass = sipassPermTables.find(x=>x.tablename==perm.tablename)
        if(sipass){
            perm.tableid = sipass.tableid;
            perm.accesslevels = sipass.accesslevels;
        }
        results.push(perm);
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
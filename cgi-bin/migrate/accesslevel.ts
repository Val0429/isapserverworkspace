import { Action, ParseObject } from "core/cgi-package";
import { LinearMember, AccessLevelDoor } from "core/events.gen";
import moment = require("moment");
import MemberService from "workspace/custom/services/member-service";

var action = new Action({
    loginRequired: true,
    apiToken: "door_member_CRUD"
});
/********************************
 * R: read object
 ********************************/



action.get(async () => {
    setTimeout(async () => {
        let memberService=new MemberService();
        console.log("start", moment().format())
        let memberQuery = new Parse.Query(LinearMember)                            
                            .select("permissionTable")
                            .include("permissionTable.accesslevels.door")
                            .include("permissionTable.accesslevels.doorgroup.doors");
        let count =  await memberQuery.count();
        let test = await new Parse.Query(AccessLevelDoor).first()
        if(test){
            return {message: "all member access levels have been migrated "}
        }
        
        let current=0;
        let limit=50;
        console.log("member count", count)
        while(current<count){
            let members = await memberQuery
            .limit(limit)
            .skip(current)
            .find();
            console.log("current", current);           
           
            let objects = [];
          
            for(let member of members){
                let res = memberService.normalizePermissionTable(member);  
                if(!Array.isArray(res))continue;
                objects.push(...res);
            }
            console.log("saving AccessLevelDoor", objects.length);
            await ParseObject.saveAll(objects); 
            current+=limit;
            
        }
        console.log("end", moment().format())
    },1000);
        
        return {success:true}

});


/// CRUD end ///////////////////////////////////

export default action;
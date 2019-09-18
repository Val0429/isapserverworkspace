import { Action, ParseObject } from "core/cgi-package";
import { LinearMember, AccessLevelDoor } from "core/events.gen";
import moment = require("moment");

var action = new Action({
    // loginRequired: true,
    // apiToken: "door_member_CRUD"
});
/********************************
 * R: read object
 ********************************/



action.get(async () => {
    setTimeout(async () => {
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
        let limit=20;
        console.log("member count", count)
        while(current<count){
            let members = await memberQuery
            .limit(limit)
            .skip(current)
            .find();
            console.log("current", current);
            
            
          
            for(let member of members){
                let objects = [];
                for(let permission of member.attributes.permissionTable){                               
                    for(let access of permission.attributes.accesslevels){
                        if(access.attributes.type!="door" && access.attributes.type!="doorGroup")continue;
                        if(access.attributes.doorgroup && Array.isArray(access.attributes.doorgroup.attributes.doors)){
                            for(let door of access.attributes.doorgroup.attributes.doors){
                                let newAccessLevel = new AccessLevelDoor({member,door, doorgroup:access.attributes.doorgroup,permissiontable:permission,accesslevel:access,timeschedule:access.attributes.timeschedule});
                                objects.push(newAccessLevel);
                            }
                        }
                        if(access.attributes.door){
                            let newAccessLevel = new AccessLevelDoor({member, door:access.attributes.door,permissiontable:permission,accesslevel:access,timeschedule:access.attributes.timeschedule});
                            objects.push(newAccessLevel);
                        }
                    }                    
                }    
                console.log("saving objects", objects.length);
                await ParseObject.saveAll(objects);            
            }
            
            current+=limit;
            
        }
        console.log("end", moment().format())
    },1000);
        
        return {success:true}

});


/// CRUD end ///////////////////////////////////

export default action;
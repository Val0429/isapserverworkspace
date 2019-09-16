import { Action, ParseObject } from "core/cgi-package";
import { PermissionTable, Member, LinearMember } from "core/events.gen";
import MemberService from "workspace/custom/services/member-service";
import { ICardholderObject } from "workspace/custom/modules/acs/sipass/siPass_define";

var action = new Action({
    loginRequired: true,
    apiToken: "door_member_CRUD"
});
/********************************
 * R: read object
 ********************************/



action.get(async () => {
        let linearCount =  await new Parse.Query(LinearMember).count();
        if(linearCount>0){
            return {message: "all members have been migrated "+linearCount}
        }
        let memberService = new MemberService();
        let current=0;
        let permissionTables = await new Parse.Query(PermissionTable)
                                        .equalTo("system",0)
                                        .find();
        let count =  await new Parse.Query(Member)
                    .count();
        console.log("member count", count)
        while(current<count){
            let o = await new Parse.Query(Member)
            .limit(100)
            .skip(current)
            .find();
            console.log("o", o.length);
            
            let members:ICardholderObject[] = o.map(x=>ParseObject.toOutputJSON(x));
            
            let objects = [];
            for(let member of members){
                let normalized = memberService.normalizeToLinearMember(member, permissionTables);
                let linearMember = new LinearMember(normalized);                
                objects.push(linearMember);
            }
            await ParseObject.saveAll(objects);
            current+=100;
            console.log("saving current", current);
        }
        

});


/// CRUD end ///////////////////////////////////

export default action;
import { Action, ParseObject } from "core/cgi-package";
import { AccessLevel } from "core/events.gen";

var action = new Action({
    // loginRequired: true,
    // apiToken: "door_member_CRUD"
});
/********************************
 * R: read object
 ********************************/



action.get(async () => {
        let accessQuery = new Parse.Query(AccessLevel).include("doorgroup.doors")
                            .containedIn("type", ["door","doorGroup"])
                            
                            .doesNotExist("doors");
        let count =  await accessQuery.count();
        if(count<=0){
            return {message: "all access levels have been migrated "+count}
        }
        
        let current=0;
        
        console.log("access count", count)
        while(current<count){
            let items = await accessQuery
            .limit(100)
            .skip(current)
            .find();
            console.log("o", items.length);
            
            
            let objects = [];
            for(let item of items){
                if(item.attributes.type=="door"){
                    item.set("doors", [item.get("door")])
                }
                if(item.attributes.type=="doorGroup"){                    
                    item.set("doors", item.attributes.doorgroup.attributes.doors);
                }                
                objects.push(item);
            }
            await ParseObject.saveAll(objects);
            current+=100;
            console.log("saving current", current);
        }
        return {success:true}

});


/// CRUD end ///////////////////////////////////

export default action;
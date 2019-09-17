import {
    Action, ParseObject, CCureClearance} from 'core/cgi-package';
import { GetMigrationDataPermissionTable } from 'workspace/custom/modules/acs/ccure/Migration';


var action = new Action({
    loginRequired: true    
});

/********************************
 * R: get object
 ********************************/

action.get(async () => {
    let ccureClearances = await GetMigrationDataPermissionTable();   
    return ccureClearances; 
});
action.post(async () => {
    let existingData = await new Parse.Query(CCureClearance).limit(1000).find();
    await ParseObject.destroyAll(existingData);
    let ccureClearances = await GetMigrationDataPermissionTable();
    let parseObjects=[];
    for(let key in ccureClearances){
        let parseObject = new CCureClearance({name:key, data:ccureClearances[key]});
        parseObjects.push(parseObject);   
    }
    await ParseObject.saveAll(parseObjects);
    
    return {success:true}; 
});

export default action;


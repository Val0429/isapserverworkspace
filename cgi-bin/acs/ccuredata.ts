import {
    Action} from 'core/cgi-package';
import { GetMigrationDataPermissionTable } from 'workspace/custom/modules/acs/ccure/Migration';


var action = new Action({
    loginRequired: true    
});

/********************************
 * R: get object
 ********************************/

action.get<any, any>({}, async () => {
    let ccureClearances = await GetMigrationDataPermissionTable();   
    return ccureClearances; 
});


export default action;


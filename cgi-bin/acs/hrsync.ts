import {
    Action
} from 'core/cgi-package';

import {SyncService} from '../../custom/services/SyncService';
import { HRService } from 'workspace/custom/services/hr-service';

var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    // apiToken: "3-1_door_accesslevel_CRUD"
});

/********************************
 * R: get object
 ********************************/

action.get<any, any>({}, async () => {
    
   
    let syncService = new HRService();
    //await Promise.all([
        let dt = new Date();
        await syncService.doSync();
    //]);
      
    

    return { success: true };
});


export default action;


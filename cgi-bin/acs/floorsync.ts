import {
    Action
} from 'core/cgi-package';

import {SyncService} from '../../custom/services/SyncService';

var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    // apiToken: "3-1_door_accesslevel_CRUD"
});

/********************************
 * R: get object
 ********************************/

action.get<any, any>({}, async () => {
    
   
    let syncService = new SyncService();
    await Promise.all([
        syncService.syncSipassFloor(),
        syncService.syncCcureFloor()
    ]);
      
    

    return { success: true };
});


export default action;


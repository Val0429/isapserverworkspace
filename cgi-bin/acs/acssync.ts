import {
    Action
} from 'core/cgi-package';

import {SyncService} from '../../custom/services/SyncService';

var action = new Action({
    loginRequired: false,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    // apiToken: "3-1_door_accesslevel_CRUD"
});

/********************************
 * R: get object
 ********************************/

action.get<any, any>({}, async () => {
    
   
    let syncService = new SyncService();
    await syncService.syncCcureDoor();
    await syncService.syncSipassReader();

    await syncService.syncSipassFloor();

    await syncService.syncCcureDoorReader();
    await syncService.syncCcureFloor();
      
    

    return { success: true };
});


export default action;


import {
    Action, Errors
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
    
   try{
        let syncService = new SyncService();
        //await Promise.all([
            await syncService.syncSipassFloor();
            await syncService.syncCcureFloor();
        //]);
        
        

        return { success: true };
    }catch(err){
        console.log("error floor sync", JSON.stringify(err));
        throw Errors.throw(Errors.CustomNotExists, ["Sync failed, please contact admin"]);
    }
});


export default action;


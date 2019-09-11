import {
    Action, Errors
} from 'core/cgi-package';

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
    
   try{
        let syncService = new HRService();
            await syncService.doSync();
        //]);
        
        

        return { success: true };
    }catch(err){
        throw Errors.throw(Errors.CustomNotExists, [JSON.stringify(err)]);
    }
});


export default action;


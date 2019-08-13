import {
    Action
} from 'core/cgi-package';
import { cCureAdapter } from 'workspace/custom/services/acsAdapter-Manager';


var action = new Action({
    loginRequired: false    
});

/********************************
 * R: get object
 ********************************/

action.get<any, any>({}, async () => {
    
  

    let doorGroups = await cCureAdapter.getAllOrganizedDoorGroup();
    let floorGroups = await cCureAdapter.getAllOrganizedFloorGroup();
    return { doorGroups, floorGroups };
});


export default action;


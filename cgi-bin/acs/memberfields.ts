import { Action, Errors, Restful, ParseObject} from 'core/cgi-package';


import { ILinearMember, LinearMember } from '../../custom/models'
import { siPassAdapter } from '../../custom/services/acsAdapter-Manager';
import { CCure800SqlAdapter } from '../../custom/services/acs/CCure800SqlAdapter';
import { Log } from 'workspace/custom/services/log';
import MemberService, { memberFields } from 'workspace/custom/services/member-service';


var action = new Action({
    loginRequired: true,
    postSizeLimit: 1024 * 1024 * 10,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "door_member_CRUD"
});


/********************************
 * R: get object
 ********************************/


action.get(async () => {
    return memberFields;
});

/// CRUD end ///////////////////////////////////

export default action;





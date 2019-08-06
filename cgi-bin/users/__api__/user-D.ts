import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, UserType,
    RoleInterfaceLiteralList, IUserSystemAdministrator, IUserAdministrator, IUserTenantAdministrator, IUserTenantUser,
    getEnumKey, getEnumKeyArray, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
    deepMerge
} from 'core/cgi-package';

import { permissionMapD, getAvailableRoles } from './core';

export type InputD = Restful.InputD<IUser<any>>;
export type OutputD = Restful.OutputD<IUser<any>>;

export default function(action: Action) {

function validate(currentUser: Parse.User, targetUser: Parse.User) {
    /// 1) Get available roles
    let availableRoles = getAvailableRoles(currentUser.get("roles"), permissionMapD);
    let targetRoles: RoleList[] = targetUser.get("roles").map( (role) => role.getName() );

    do {
        /// 2) It's not ok to delete self
        if (currentUser.id === targetUser.id) throw Errors.throw(Errors.CustomInvalid, [`You cannot delete yourself.`]);

        /// 3) target role should complete intersect with available roles
        let invalidRoles = targetRoles.filter( (role) => availableRoles.indexOf(role) < 0 );
        if (invalidRoles.length > 0) throw Errors.throw(Errors.PermissionDenied);

    } while(0);
}

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    const { objectId } = data.inputType;

    /// 1) Get User
    var user = await new Parse.Query(Parse.User)
        .include("roles")
        .get(objectId);
    if (!user) throw Errors.throw(Errors.CustomNotExists, [`User <${objectId}> not exists.`]);
    
    /// 2) Check available
    validate(data.user, user);

    /// 3) Perform
    user.destroy({ useMasterKey: true });

    return ParseObject.toOutputJSON(user);
});

}

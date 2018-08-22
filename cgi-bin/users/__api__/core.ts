import {
    RoleList
} from 'core/cgi-package';

/**
 * SystemAdministrator: Can only create SystemAdministrator, Administrator.
 * Administrator: Can only crate TenantAdministrator.
 * TenantAdministrator: Can only create TenantUser.
 */
export const permissionMapC = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator],
    [RoleList.Administrator]: [RoleList.TenantAdministrator], //, RoleList.TenantUser],
    [RoleList.TenantAdministrator]: [RoleList.TenantUser]
}

/**
 * SystemAdministrator: Can only see SystemAdministrator, Administrator.
 * Administrator: Can only see TenantAdministrator and self.
 * TenantAdministrator: Can see everything in same company.
 * TenantUser: Can only see his invited Visitor.
 */
export const permissionMapR = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator],
    [RoleList.Administrator]: [RoleList.TenantAdministrator], // RoleList.Administrator, 
    [RoleList.TenantAdministrator]: [RoleList.TenantAdministrator, RoleList.TenantUser]
}

/**
 * SystemAdministrator: Can only update SystemAdministrator, Administrator.
 * Administrator: Can only update TenantAdministrator and self.
 * TenantAdministrator: Can only update TenantUser, and self.
 * TenantUser: Can only update Visitors.
 */
export const permissionMapU = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator],
    [RoleList.Administrator]: [RoleList.Administrator, RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [RoleList.TenantAdministrator, RoleList.TenantUser]
}
/**
 * SystemAdministrator: Can only delete Administrator.
 * Administrator: Can only delete TenantAdministrator. All TenantUser created by it should be deleted accordingly.
 * TenantAdministrator: Can only delete TenantUser created by him. All visitors created by it should be deleted accordingly.
 * TenantUser: Can only delete Visitors created by him.
 */
export const permissionMapD = {
    [RoleList.SystemAdministrator]: [RoleList.Administrator],
    [RoleList.Administrator]: [RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [RoleList.TenantUser]
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

export function getAvailableRoles(currentUserRoles: Parse.Role[], permissionMap: any) {
    /// 1) Get Current User Roles
    let roles = currentUserRoles.map( (role) => role.getName() );
    /// 2) Get Available Create Roles
    let availableRoles: RoleList[] = roles.reduce( (final, data) => {
        let permissions = permissionMap[data];
        final.splice(final.length, 0, ...permissions);
        return final;
    }, []);
    /// 3) Make unique
    return availableRoles.filter( onlyUnique );
}

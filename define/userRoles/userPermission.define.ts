import { RoleList } from 'core/cgi-package';

/**
 *
 */
export interface IPermissionMap {
    [RoleList.SystemAdministrator]: RoleList[];
    [RoleList.Administrator]: RoleList[];
    [RoleList.TenantAdministrator]: RoleList[];
    [RoleList.VMS]: RoleList[];
}

/**
 *
 */
export const permissionMapC: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.TenantAdministrator, RoleList.VMS],
    [RoleList.Administrator]: [RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [],
    [RoleList.VMS]: [],
};

/**
 *
 */
export const permissionMapR: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.TenantAdministrator, RoleList.VMS],
    [RoleList.Administrator]: [RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [],
    [RoleList.VMS]: [],
};

/**
 *
 */
export const permissionMapU: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.TenantAdministrator, RoleList.VMS],
    [RoleList.Administrator]: [RoleList.Administrator, RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [RoleList.TenantAdministrator],
    [RoleList.VMS]: [RoleList.VMS],
};

/**
 *
 */
export const permissionMapD: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.Administrator, RoleList.TenantAdministrator, RoleList.VMS],
    [RoleList.Administrator]: [RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [],
    [RoleList.VMS]: [],
};

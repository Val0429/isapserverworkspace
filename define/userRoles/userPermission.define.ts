import { RoleList } from 'core/cgi-package';

/**
 *
 */
export interface IPermissionMap {
    [RoleList.SystemAdministrator]: RoleList[];
    [RoleList.Administrator]: RoleList[];
    [RoleList.TenantAdministrator]: RoleList[];
}

/**
 *
 */
export const permissionMapC: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.TenantAdministrator],
    [RoleList.Administrator]: [RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [],
};

/**
 *
 */
export const permissionMapR: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.TenantAdministrator],
    [RoleList.Administrator]: [RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [],
};

/**
 *
 */
export const permissionMapU: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.TenantAdministrator],
    [RoleList.Administrator]: [RoleList.Administrator, RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [RoleList.TenantAdministrator],
};

/**
 *
 */
export const permissionMapD: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.Administrator, RoleList.TenantAdministrator],
    [RoleList.Administrator]: [RoleList.TenantAdministrator],
    [RoleList.TenantAdministrator]: [],
};

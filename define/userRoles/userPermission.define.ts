import { RoleList } from 'core/cgi-package';

/**
 *
 */
export interface IPermissionMap {
    [RoleList.SystemAdministrator]: RoleList[];
    [RoleList.Administrator]: RoleList[];
}

/**
 *
 */
export const permissionMapC: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator],
    [RoleList.Administrator]: [RoleList.Administrator],
};

/**
 *
 */
export const permissionMapR: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator],
    [RoleList.Administrator]: [RoleList.Administrator],
};

/**
 *
 */
export const permissionMapU: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator],
    [RoleList.Administrator]: [RoleList.Administrator],
};

/**
 *
 */
export const permissionMapD: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Administrator],
    [RoleList.Administrator]: [RoleList.Administrator],
};

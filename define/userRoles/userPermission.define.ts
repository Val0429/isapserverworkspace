import { RoleList } from 'core/cgi-package';

/**
 *
 */
export interface IPermissionMap {
    [RoleList.SystemAdministrator]: RoleList[];
    [RoleList.Admin]: RoleList[];
    [RoleList.User]: RoleList[];
}

/**
 *
 */
export const permissionMapC: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Admin, RoleList.User],
    [RoleList.Admin]: [RoleList.Admin, RoleList.User],
    [RoleList.User]: [],
};

/**
 *
 */
export const permissionMapR: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Admin, RoleList.User],
    [RoleList.Admin]: [RoleList.Admin, RoleList.User],
    [RoleList.User]: [],
};

/**
 *
 */
export const permissionMapU: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Admin, RoleList.User],
    [RoleList.Admin]: [RoleList.Admin, RoleList.User],
    [RoleList.User]: [RoleList.User],
};

/**
 *
 */
export const permissionMapD: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Admin, RoleList.User],
    [RoleList.Admin]: [RoleList.Admin, RoleList.User],
    [RoleList.User]: [],
};

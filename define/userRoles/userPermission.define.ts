import { RoleList } from 'core/cgi-package';

/**
 *
 */
export interface IPermissionMap {
    [RoleList.SystemAdministrator]: RoleList[];
    [RoleList.Manager]: RoleList[];
    [RoleList.User]: RoleList[];
}

/**
 *
 */
export const permissionMapC: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Manager, RoleList.User],
    [RoleList.Manager]: [RoleList.User],
    [RoleList.User]: [],
};

/**
 *
 */
export const permissionMapR: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Manager, RoleList.User],
    [RoleList.Manager]: [RoleList.User],
    [RoleList.User]: [],
};

/**
 *
 */
export const permissionMapU: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Manager, RoleList.User],
    [RoleList.Manager]: [RoleList.User],
    [RoleList.User]: [],
};

/**
 *
 */
export const permissionMapD: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Manager, RoleList.User],
    [RoleList.Manager]: [RoleList.User],
    [RoleList.User]: [],
};

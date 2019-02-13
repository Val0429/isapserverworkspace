import { RoleList } from 'core/cgi-package';

/**
 *
 */
export interface IPermissionMap {
    [RoleList.SystemAdmin]: RoleList[];
    [RoleList.Admin]: RoleList[];
    [RoleList.Manager]: RoleList[];
    [RoleList.User]: RoleList[];
}

/**
 *
 */
export const permissionMapC: IPermissionMap = {
    [RoleList.SystemAdmin]: [RoleList.SystemAdmin, RoleList.Admin, RoleList.Manager, RoleList.User],
    [RoleList.Admin]: [RoleList.Admin, RoleList.Manager, RoleList.User],
    [RoleList.Manager]: [RoleList.User],
    [RoleList.User]: [],
};

/**
 *
 */
export const permissionMapR: IPermissionMap = {
    [RoleList.SystemAdmin]: [RoleList.SystemAdmin, RoleList.Admin, RoleList.Manager, RoleList.User],
    [RoleList.Admin]: [RoleList.Admin, RoleList.Manager, RoleList.User],
    [RoleList.Manager]: [RoleList.User],
    [RoleList.User]: [],
};

/**
 *
 */
export const permissionMapU: IPermissionMap = {
    [RoleList.SystemAdmin]: [RoleList.SystemAdmin, RoleList.Admin, RoleList.Manager, RoleList.User],
    [RoleList.Admin]: [RoleList.Admin, RoleList.Manager, RoleList.User],
    [RoleList.Manager]: [RoleList.User],
    [RoleList.User]: [],
};

/**
 *
 */
export const permissionMapD: IPermissionMap = {
    [RoleList.SystemAdmin]: [RoleList.SystemAdmin, RoleList.Admin, RoleList.Manager, RoleList.User],
    [RoleList.Admin]: [RoleList.Admin, RoleList.Manager, RoleList.User],
    [RoleList.Manager]: [RoleList.User],
    [RoleList.User]: [],
};

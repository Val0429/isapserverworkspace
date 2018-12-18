import { RoleList } from 'core/cgi-package';

/**
 *
 */
export interface IPermissionMap {
    [RoleList.SystemAdmin]: RoleList[];
    [RoleList.Admin]: RoleList[];
    [RoleList.Manager]: RoleList[];
    [RoleList.User]: RoleList[];
    [RoleList.Investigator]: RoleList[];
    [RoleList.Edge]: RoleList[];
}

/**
 *
 */
export const permissionMapC: IPermissionMap = {
    [RoleList.SystemAdmin]: [RoleList.SystemAdmin, RoleList.Admin, RoleList.Manager, RoleList.User, RoleList.Investigator, RoleList.Edge],
    [RoleList.Admin]: [RoleList.Admin, RoleList.Manager, RoleList.User, RoleList.Investigator, RoleList.Edge],
    [RoleList.Manager]: [RoleList.User, RoleList.Investigator, RoleList.Edge],
    [RoleList.User]: [RoleList.Investigator, RoleList.Edge],
    [RoleList.Investigator]: [RoleList.Edge],
    [RoleList.Edge]: [],
};

/**
 *
 */
export const permissionMapR: IPermissionMap = {
    [RoleList.SystemAdmin]: [RoleList.SystemAdmin, RoleList.Admin, RoleList.Manager, RoleList.User, RoleList.Investigator, RoleList.Edge],
    [RoleList.Admin]: [RoleList.Admin, RoleList.Manager, RoleList.User, RoleList.Investigator, RoleList.Edge],
    [RoleList.Manager]: [RoleList.User, RoleList.Investigator, RoleList.Edge],
    [RoleList.User]: [RoleList.Investigator, RoleList.Edge],
    [RoleList.Investigator]: [RoleList.Edge],
    [RoleList.Edge]: [],
};

/**
 *
 */
export const permissionMapU: IPermissionMap = {
    [RoleList.SystemAdmin]: [RoleList.SystemAdmin, RoleList.Admin, RoleList.Manager, RoleList.User, RoleList.Investigator, RoleList.Edge],
    [RoleList.Admin]: [RoleList.Admin, RoleList.Manager, RoleList.User, RoleList.Investigator, RoleList.Edge],
    [RoleList.Manager]: [RoleList.User, RoleList.Investigator, RoleList.Edge],
    [RoleList.User]: [RoleList.Investigator, RoleList.Edge],
    [RoleList.Investigator]: [RoleList.Edge],
    [RoleList.Edge]: [],
};

/**
 *
 */
export const permissionMapD: IPermissionMap = {
    [RoleList.SystemAdmin]: [RoleList.SystemAdmin, RoleList.Admin, RoleList.Manager, RoleList.User, RoleList.Investigator, RoleList.Edge],
    [RoleList.Admin]: [RoleList.Admin, RoleList.Manager, RoleList.User, RoleList.Investigator, RoleList.Edge],
    [RoleList.Manager]: [RoleList.User, RoleList.Investigator, RoleList.Edge],
    [RoleList.User]: [RoleList.Investigator, RoleList.Edge],
    [RoleList.Investigator]: [RoleList.Edge],
    [RoleList.Edge]: [],
};

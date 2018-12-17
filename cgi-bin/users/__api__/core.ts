import { RoleList, Errors, getEnumKeyArray, Parse } from 'core/cgi-package';

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

/**
 *
 */
export function GetAvailableRoles(currentUserRoles: Parse.Role[], permissionMap: IPermissionMap): RoleList[] {
    let roles: string[] = currentUserRoles.map((value) => {
        return value.getName();
    });

    let availableRoles: RoleList[] = roles.reduce((prev, value) => {
        let permissions: RoleList[] = permissionMap[value];
        prev.splice(prev.length, 0, ...permissions);

        return prev;
    }, []);

    availableRoles = availableRoles.filter((value, index, array) => {
        return array.indexOf(value) === index;
    });

    return availableRoles;
}

/**
 *
 */

export function ValidateRoles(availableRoles: RoleList[], userRoles: RoleList[]): void {
    let result: RoleList[] = userRoles.filter((value) => {
        return availableRoles.indexOf(value) < 0;
    });

    if (result.length === 0) {
        return;
    }

    throw Errors.throw(Errors.CustomUnauthorized, [`Permission denied for roles <${getEnumKeyArray(RoleList, result).join(', ')}>.`]);
}

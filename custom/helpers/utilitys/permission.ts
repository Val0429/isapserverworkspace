import { RoleList } from 'core/userRoles.gen';
import { Errors } from 'core/errors.gen';
import { IPermissionMap } from '../../../define/userRoles/userPermission.define';

export namespace Permission {
    /**
     * Get Available Roles
     * @param currentUserRoles
     * @param permissionMap
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
     * Get Unavailable Roles
     * @param currentUserRoles
     * @param permissionMap
     */
    export function GetUnavailableRoles(currentUserRoles: Parse.Role[], permissionMap: IPermissionMap): RoleList[] {
        let roles: RoleList[] = Object.keys(RoleList).map((value, index, array) => {
            return RoleList[value];
        });
        let availableRoles: RoleList[] = GetAvailableRoles(currentUserRoles, permissionMap);

        let unavailableRoles: RoleList[] = roles.filter((value, index, array) => {
            return availableRoles.indexOf(value) < 0;
        });

        return unavailableRoles;
    }

    /**
     * Validate Roles
     * @param availableRoles
     * @param roles
     * @param roleLists
     */
    export function ValidateRoles(availableRoles: RoleList[], roles: Parse.Role[]);
    export function ValidateRoles(availableRoles: RoleList[], roleLists: RoleList[]);
    export function ValidateRoles(availableRoles: RoleList[], userRoles: RoleList[] | Parse.Role[]): void {
        let roleLists: RoleList[] = [];

        if (userRoles.length > 0 && userRoles[0] instanceof Parse.Role) {
            roleLists = (userRoles as Parse.Role[]).map((value, index, array) => {
                return value.getName() as RoleList;
            });
        } else {
            roleLists = userRoles as RoleList[];
        }

        roleLists = roleLists.filter((value) => {
            return availableRoles.indexOf(value) < 0;
        });

        if (roleLists.length === 0) {
            return;
        }

        throw Errors.throw(Errors.CustomUnauthorized, [`Permission denied for roles.`]);
    }

    /**
     * Get Unavailable RoleLists
     * @param roleLists
     * @param permissionMap
     */
    export function GetUnavailableRoleLists(roleLists: RoleList[], permissionMap: IPermissionMap): RoleList[] {
        roleLists = [].concat(
            ...roleLists.map((value, index, array) => {
                return permissionMap[value];
            }),
        );

        let roles = Object.keys(RoleList).map((value, index, array) => {
            return RoleList[value];
        });

        roles = roles.filter((value, index, array) => {
            return roleLists.indexOf(value) < 0;
        });

        return roles;
    }
}

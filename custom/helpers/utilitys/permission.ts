import { RoleList, Errors, getEnumKeyArray } from 'core/cgi-package';
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
     * Validate Roles
     * @param availableRoles
     * @param userRoles
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
}

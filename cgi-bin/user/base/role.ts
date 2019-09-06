import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Permission } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { permissionMapC, permissionMapR, permissionMapU, permissionMapD } from '../../../define/userRoles/userPermission.define';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IUser.IBaseRoleU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _userId: string = _input.objectId || data.user.id;

            if (_input.roles.length === 0) {
                throw Errors.throw(Errors.CustomBadRequest, ['role can not none']);
            }

            let user: Parse.User = await new Parse.Query(Parse.User)
                .equalTo('objectId', _userId)
                .include('roles')
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!user) {
                throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
            }

            let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapU);
            Permission.ValidateRoles(availableRoles, user.get('roles'));

            let roles: Parse.Role[] = await new Parse.Query(Parse.Role)
                .containedIn('name', _input.roles)
                .find()
                .fail((e) => {
                    throw e;
                });

            user.set('roles', roles);

            await user.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

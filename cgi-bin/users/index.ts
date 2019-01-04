import { IUser, Action, Restful, RoleList, Errors, Parse } from 'core/cgi-package';
import { Permission } from '../../custom/helpers';
import { IUserCustom } from '../../custom/models';
import { permissionMapC, permissionMapR, permissionMapU, permissionMapD } from '../../define/userRoles/userPermission.define';

let action = new Action({
    loginRequired: true,
    permission: [],
});

export default action;

/**
 * Action Create User
 */
type InputC = IUser<IUserCustom>;
type OutputC = string;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapC);
        Permission.ValidateRoles(availableRoles, _input.roles);

        let roles: Parse.Role[] = [];
        for (let name of _input.roles) {
            let role: Parse.Role = await new Parse.Query(Parse.Role).equalTo('name', name).first();
            roles.push(role);
        }

        _input.data.creator = data.user;

        let user: Parse.User = new Parse.User();
        try {
            user = await user.signUp(
                {
                    ..._input,
                    roles: roles,
                },
                {
                    useMasterKey: true,
                },
            );
        } catch (e) {
            throw Errors.throw(Errors.CustomBadRequest, [e]);
        }

        return '';
    },
);

/**
 * Action Read User
 */
type InputR = null;
type OutputR = Parse.User[];

action.get(
    async (data): Promise<OutputR> => {
        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapR);

        let users: Parse.User[] = await new Parse.Query(Parse.User)
            .include('roles')
            .include('data.creator')
            .find();

        users = users.filter((value, index, array) => {
            let roles: RoleList[] = value.attributes.roles.map((value) => {
                return value.getName();
            });

            try {
                Permission.ValidateRoles(availableRoles, roles);
                return true;
            } catch {
                return false;
            }
        });

        return users;
    },
);

/**
 * Action Delete User
 */
type InputD = {
    objectId: string;
};
type OutputD = string;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        if (_input.objectId == '') {
            throw Errors.throw(Errors.ParametersRequired, ['objectId']);
        }

        let user: Parse.User = await new Parse.Query(Parse.User).include('roles').get(_input.objectId);
        if (!user) {
            throw Errors.throw(Errors.CustomNotExists, [`User <${_input.objectId}> not exists.`]);
        }
        if (user.id == data.user.id) {
            throw Errors.throw(Errors.CustomBadRequest, ['Can not delete self.']);
        }

        let roles: RoleList[] = user.attributes.roles.map((value) => {
            return value.getName();
        });

        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapD);
        Permission.ValidateRoles(availableRoles, roles);

        await user.destroy({ useMasterKey: true });

        return '';
    },
);

import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse } from '../../../custom/models';
import { Permission, Print } from '../../../custom/helpers';
import { permissionMapC, permissionMapR, permissionMapU, permissionMapD } from '../../../define/userRoles/userPermission.define';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IUser.IBaseIndexC;

type OutputC = IResponse.IUser.IBaseIndexC;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapC);

        let user: Parse.User = await CreateUser(_input, availableRoles);

        return {
            userId: user.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IUser.IBaseIndexR[]>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let unavailableRoles: RoleList[] = Permission.GetUnavailableRoles(data.role, permissionMapR);

        let tasks: Promise<any>[] = unavailableRoles.map((value, index, array) => {
            return new Parse.Query(Parse.Role).equalTo('name', value).first();
        });
        let roles: Parse.Role[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        let query: Parse.Query<Parse.User> = new Parse.Query(Parse.User).notContainedIn('roles', roles).include('roles');

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let users: Parse.User[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .find()
            .catch((e) => {
                throw e;
            });

        return {
            total: total,
            page: _page,
            count: _count,
            content: users.map((value, index, array) => {
                return {
                    userId: value.id,
                    account: value.getUsername(),
                    roles: value.get('roles').map((value, index, array) => {
                        return Object.keys(RoleList).find((value1, index1, array1) => {
                            return value.get('name') === RoleList[value1];
                        });
                    }),
                };
            }),
        };
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IUser.IBaseIndexD;

type OutputD = Date;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;

        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapD);

        let user: Parse.User = await new Parse.Query(Parse.User)
            .include('roles')
            .get(_input.userId)
            .catch((e) => {
                throw e;
            });

        let roles: RoleList[] = user.attributes.roles.map((value) => {
            return value.getName();
        });

        Permission.ValidateRoles(availableRoles, roles);

        await user.destroy({ useMasterKey: true }).catch((e) => {
            throw e;
        });

        return new Date();
    },
);

/**
 * Create user
 * @param input
 * @param availableRoles
 */
export async function CreateUser(input: InputC, availableRoles: RoleList[]): Promise<Parse.User> {
    try {
        Permission.ValidateRoles(availableRoles, input.roles);

        let tasks: Promise<any>[] = input.roles.map((value, index, array) => {
            return new Parse.Query(Parse.Role).equalTo('name', value).first();
        });
        let roles: Parse.Role[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        let _user: IUser = {
            username: input.account,
            password: input.password,
            roles: input.roles,
            data: {},
        };
        let user: Parse.User = new Parse.User();
        user = await user
            .signUp(
                {
                    ..._user,
                    roles: roles,
                },
                {
                    useMasterKey: true,
                },
            )
            .catch((e) => {
                throw Errors.throw(Errors.CustomBadRequest, [e]);
            });

        return user;
    } catch (e) {
        throw e;
    }
}

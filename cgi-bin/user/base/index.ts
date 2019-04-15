import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Permission, Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { permissionMapC, permissionMapR, permissionMapU, permissionMapD } from '../../../define/userRoles/userPermission.define';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator],
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
        try {
            let _input: InputC = data.inputType;

            let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapC);

            let user: Parse.User = await CreateUser(_input, availableRoles);

            return {
                userId: user.id,
            };
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
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
        try {
            let _input: InputR = data.inputType;
            let _page: number = _input.page || 1;
            let _count: number = _input.count || 10;

            let unavailableRoles: RoleList[] = Permission.GetUnavailableRoles(data.role, permissionMapR);

            let tasks: Promise<any>[] = unavailableRoles.map<any>((value, index, array) => {
                return new Parse.Query(Parse.Role).equalTo('name', value).first();
            });
            let roles: Parse.Role[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            let query: Parse.Query<Parse.User> = new Parse.Query(Parse.User).notContainedIn('roles', roles).include('roles');

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let users: Parse.User[] = await query
                .skip((_page - 1) * _count)
                .limit(_count)
                .find()
                .fail((e) => {
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
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.IUser.IBaseIndexU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapU);

            let user: Parse.User = await new Parse.Query(Parse.User)
                .include('roles')
                .get(_input.userId)
                .fail((e) => {
                    throw e;
                });

            let userRoles: RoleList[] = user.attributes.roles.map((value) => {
                return value.getName();
            });

            Permission.ValidateRoles(availableRoles, userRoles);

            let rolesCheck: RoleList[] = _input.roles.filter((value, index, array) => {
                return availableRoles.indexOf(value) < 0;
            });
            if (rolesCheck && rolesCheck.length > 0) {
                throw Errors.throw(Errors.CustomUnauthorized, [`Permission denied for roles.`]);
            }

            let tasks: Promise<any>[] = _input.roles.map<any>((value, index, array) => {
                return new Parse.Query(Parse.Role).equalTo('name', value).first();
            });
            let roles: Parse.Role[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            user.set('roles', roles);

            await user.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
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
        try {
            let _input: InputD = data.inputType;

            let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapD);

            let user: Parse.User = await new Parse.Query(Parse.User)
                .include('roles')
                .get(_input.userId)
                .fail((e) => {
                    throw e;
                });

            let roles: RoleList[] = user.attributes.roles.map((value) => {
                return value.getName();
            });

            Permission.ValidateRoles(availableRoles, roles);

            await user.destroy({ useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
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

        let tasks: Promise<any>[] = input.roles.map<any>((value, index, array) => {
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
            .fail((e) => {
                throw Errors.throw(Errors.CustomBadRequest, [e]);
            });

        return user;
    } catch (e) {
        throw e;
    }
}

import { IUser, Action, Restful, RoleList, Errors, ParseObject } from 'core/cgi-package';
import { IRequest, IResponse, CharacterCommittee } from '../../../custom/models';
import { Permission, Print } from '../../../custom/helpers';
import { permissionMapC, permissionMapR, permissionMapU, permissionMapD } from '../../../define/userRoles/userPermission.define';
import * as Base from '../base';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IUser.ICommitteeIndexC;

type OutputC = IResponse.IUser.IBaseIndexC;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapC);

        let user: Parse.User = await Base.CreateUser(
            {
                account: _input.account,
                password: _input.password,
                roles: _input.roles.map((value, index, array) => {
                    return RoleList[value];
                }),
            },
            availableRoles,
        );

        let committee: CharacterCommittee = new CharacterCommittee();
        committee.setValue('creator', data.user);
        committee.setValue('user', user);
        committee.setValue('permission', '');
        committee.setValue('adjustReason', '');

        await committee.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return {
            userId: user.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IUser.ICommitteeIndexR[]>;

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

        let committee: CharacterCommittee[] = await new Parse.Query(CharacterCommittee)
            .skip((_page - 1) * _count)
            .limit(_count)
            .include('user')
            .include('user.roles')
            .find()
            .catch((e) => {
                throw e;
            });

        return {
            total: total,
            page: _page,
            count: _count,
            content: committee.map((value, index, array) => {
                return {
                    userId: value.getValue('user').id,
                    account: value.getValue('user').getUsername(),
                    roles: value
                        .getValue('user')
                        .get('roles')
                        .map((value, index, array) => {
                            return Object.keys(RoleList).find((value1, index1, array1) => {
                                return value.get('name') === RoleList[value1];
                            });
                        }),
                    adjustReason: value.getValue('adjustReason'),
                };
            }),
        };
    },
);

/**
 * Action update
 */
type InputU = IRequest.IUser.ICommitteeIndexU;

type OutputU = string;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapU);

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

        if (_input.passwordCurrent !== null && _input.passwordCurrent !== undefined) {
            user = await Parse.User.logIn(user.getUsername(), _input.passwordPrevious).catch((e) => {
                throw e;
            });

            user.setPassword(_input.passwordCurrent);
            await user.save(null, { useMasterKey: true }).catch((e) => {
                throw e;
            });
        }

        let committee: CharacterCommittee = await new Parse.Query(CharacterCommittee)
            .equalTo('user', user)
            .first()
            .catch((e) => {
                throw e;
            });

        committee.setValue('adjustReason', _input.adjustReason);
        await committee.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return '';
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IUser.ICommitteeIndexD;

type OutputD = string;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;

        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapD);

        _input.userIds = _input.userIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _input.userIds.map((value, index, array) => {
            return new Parse.Query(Parse.User).include('roles').get(value);
        });
        let users: Parse.User[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        for (let i: number = 0; i < users.length; i++) {
            let roles: RoleList[] = users[i].attributes.roles.map((value) => {
                return value.getName();
            });

            Permission.ValidateRoles(availableRoles, roles);

            await users[i].destroy({ useMasterKey: true }).catch((e) => {
                throw e;
            });
        }

        tasks = _input.userIds.map((value, index, array) => {
            let user: Parse.User = new Parse.User();
            user.id = value;
            return new Parse.Query(CharacterCommittee).equalTo('user', user).find();
        });
        let committeess: CharacterCommittee[][] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        for (let i: number = 0; i < committeess.length; i++) {
            for (let j: number = 0; j < committeess[i].length; j++) {
                await committeess[i][j].destroy({ useMasterKey: true }).catch((e) => {
                    throw e;
                });
            }
        }

        return '';
    },
);
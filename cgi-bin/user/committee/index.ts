import { IUser, Action, Restful, RoleList, Errors, ParseObject } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Permission, Print, Db } from '../../../custom/helpers';
import { permissionMapC, permissionMapR, permissionMapU, permissionMapD } from '../../../define/userRoles/userPermission.define';
import * as Base from '../base';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
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
        let _userInfo = await Db.GetUserInfo(data);

        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapC);

        let user: Parse.User = await Base.CreateUser(
            {
                account: _input.account,
                password: _input.password,
                roles: [RoleList[_input.role]],
            },
            availableRoles,
        );

        let committee: IDB.CharacterCommittee = new IDB.CharacterCommittee();

        committee.setValue('creator', data.user);
        committee.setValue('community', _userInfo.community);
        committee.setValue('user', user);
        committee.setValue('permission', '');
        committee.setValue('adjustReason', '');
        committee.setValue('name', _input.name);
        committee.setValue('isDeleted', false);

        await committee.save(null, { useMasterKey: true }).fail((e) => {
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
        let _userInfo = await Db.GetUserInfo(data);
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<IDB.CharacterCommittee> = new Parse.Query(IDB.CharacterCommittee).equalTo('community', _userInfo.community).notEqualTo('isDeleted', true);

        let total: number = await query.count().fail((e) => {
            throw e;
        });

        let committees: IDB.CharacterCommittee[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .include(['user', 'user.roles'])
            .find()
            .fail((e) => {
                throw e;
            });

        return {
            total: total,
            page: _page,
            count: _count,
            content: committees.map((value, index, array) => {
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
                    name: value.getValue('name'),
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

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapU);

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

        let committee: IDB.CharacterCommittee = await new Parse.Query(IDB.CharacterCommittee)
            .equalTo('user', user)
            .first()
            .fail((e) => {
                throw e;
            });
        if (committee.getValue('isDeleted')) {
            throw Errors.throw(Errors.CustomBadRequest, ['committee was deleted']);
        }

        if (_input.password) {
            user.setPassword(_input.password);
            await user.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        }

        committee.setValue('adjustReason', _input.adjustReason);
        await committee.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return new Date();
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IUser.ICommitteeIndexD;

type OutputD = Date;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _userIds: string[] = [].concat(data.parameters.userIds);

        _userIds = _userIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapD);

        let tasks: Promise<any>[] = _userIds.map<any>((value, index, array) => {
            return new Parse.Query(Parse.User).include('roles').get(value);
        });
        let users: Parse.User[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = _userIds.map<any>((value, index, array) => {
            let user: Parse.User = new Parse.User();
            user.id = value;
            return new Parse.Query(IDB.CharacterCommittee).equalTo('user', user).find();
        });
        let committeess: IDB.CharacterCommittee[][] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = [];

        for (let i: number = 0; i < committeess.length; i++) {
            for (let j: number = 0; j < committeess[i].length; j++) {
                committeess[i][j].setValue('isDeleted', true);

                tasks.push(<any>committeess[i][j].save(null, { useMasterKey: true }));
            }
        }

        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return new Date();
    },
);

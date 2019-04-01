import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import {} from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IUser.IUserIndexC;

type OutputC = IResponse.IUser.IUserIndexC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.SystemAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let role: Parse.Role = await new Parse.Query(Parse.Role)
            .equalTo('name', RoleList[_input.role])
            .first()
            .fail((e) => {
                throw e;
            });

        let user: Parse.User = new Parse.User();
        user = await user.signUp({ username: _input.account, password: _input.password, roles: [role] }, { useMasterKey: true }).fail((e) => {
            throw Errors.throw(Errors.CustomBadRequest, [e]);
        });

        let info: IDB.UserInfo = new IDB.UserInfo();

        info.setValue('creator', data.user);
        info.setValue('user', user);
        info.setValue('name', _input.name);
        info.setValue('isDeleted', false);

        await info.save(null, { useMasterKey: true }).fail((e) => {
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

type OutputR = IResponse.IDataList<IResponse.IUser.IUserIndexR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.SystemAdministrator, RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let roleSystemAdministrator: Parse.Role = await new Parse.Query(Parse.Role)
            .equalTo('name', RoleList.SystemAdministrator)
            .first()
            .fail((e) => {
                throw e;
            });

        let users: Parse.User[] = await new Parse.Query(Parse.User)
            .notContainedIn('roles', [roleSystemAdministrator])
            .find()
            .fail((e) => {
                throw e;
            });

        let query: Parse.Query<IDB.UserInfo> = new Parse.Query(IDB.UserInfo).containedIn('user', users).equalTo('isDeleted', false);

        let total: number = await query.count().fail((e) => {
            throw e;
        });

        let infos: IDB.UserInfo[] = await query
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
            content: infos.map((value, index, array) => {
                return {
                    userId: value.getValue('user').id,
                    account: value.getValue('user').getUsername(),
                    name: value.getValue('name'),
                    roles: value
                        .getValue('user')
                        .get('roles')
                        .map((value1, index1, array1) => {
                            return Object.keys(RoleList).find((value2, index2, array2) => {
                                return value1.get('name') === RoleList[value2];
                            });
                        }),
                };
            }),
        };
    },
);

/**
 * Action update
 */
type InputU = IRequest.IUser.IUserIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.SystemAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;
        let _userId: string = _input.userId || data.user.id;

        let user: Parse.User = await new Parse.Query(Parse.User)
            .include('roles')
            .get(_userId)
            .fail((e) => {
                throw e;
            });
        if (!user) {
            throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
        }

        let info: IDB.UserInfo = await new Parse.Query(IDB.UserInfo)
            .equalTo('user', user)
            .first()
            .fail((e) => {
                throw e;
            });
        if (!info) {
            throw Errors.throw(Errors.CustomBadRequest, ['info not found']);
        }

        if (_input.role) {
            let role: Parse.Role = await new Parse.Query(Parse.Role)
                .equalTo('name', RoleList[_input.role])
                .first()
                .fail((e) => {
                    throw e;
                });

            user.set('roles', [role]);
        }
        if (_input.password) {
            user.setPassword(_input.password);
        }
        if (_input.name) {
            info.setValue('name', _input.name);
        }

        await user.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        await info.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return new Date();
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IUser.IUserIndexD;

type OutputD = Date;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _userIds: string[] = [].concat(data.parameters.userIds);

        _userIds = _userIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _userIds.map<any>((value, index, array) => {
            let user: Parse.User = new Parse.User();
            user.id = value;

            return new Parse.Query(IDB.UserInfo).equalTo('user', user).first();
        });

        let infos: IDB.UserInfo[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = infos.map<any>((value, index, array) => {
            value.setValue('isDeleted', true);

            return value.save(null, { useMasterKey: true });
        });

        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return new Date();
    },
);

import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print } from '../../../custom/helpers';
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
        permission: [RoleList.Admin],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let role: Parse.Role = await new Parse.Query(Parse.Role)
                .equalTo('name', _input.role)
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
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IUser.IUserIndexR>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _paging: IRequest.IPaging = _input.paging || { page: 1, pageSize: 10 };
            let _page: number = _paging.page || 1;
            let _pageSize: number = _paging.pageSize || 10;

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
            let totalPage: number = Math.ceil(total / _pageSize);

            let infos: IDB.UserInfo[] = await query
                .skip((_page - 1) * _pageSize)
                .limit(_pageSize)
                .include(['user', 'user.roles'])
                .find()
                .fail((e) => {
                    throw e;
                });

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _page,
                    pageSize: _pageSize,
                },
                results: infos.map((value, index, array) => {
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
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
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
        permission: [RoleList.Admin],
    },
    async (data): Promise<OutputU> => {
        try {
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
                    .equalTo('name', _input.role)
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
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
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
        try {
            let _input: InputD = data.inputType;
            let _userIds: string[] = [].concat(data.parameters.userIds);

            _userIds = _userIds.filter((value, index, array) => {
                return array.indexOf(value) === index;
            });

            let tasks: Promise<any>[] = _userIds.map<any>((value, index, array) => {
                let user: Parse.User = new Parse.User();
                user.id = value;

                return new Parse.Query(IDB.UserInfo)
                    .equalTo('user', user)
                    .equalTo('isDeleted', false)
                    .include('user')
                    .first();
            });

            let infos: IDB.UserInfo[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            infos = infos.filter((value, index, array) => {
                return value;
            });

            tasks = [].concat(
                ...infos.map((value, index, array) => {
                    value.setValue('isDeleted', true);
                    value.setValue('deleter', data.user);

                    return [value.getValue('user').destroy({ useMasterKey: true }), value.save(null, { useMasterKey: true })];
                }),
            );

            await Promise.all(tasks).catch((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

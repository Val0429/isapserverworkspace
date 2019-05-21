import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Regex, Parser } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Create
 */
type InputC = IRequest.IUser.IUserIndexC[];

type OutputC = IResponse.IMultiData[];

action.post(
    {
        inputType: 'MultiData',
        permission: [RoleList.Admin],
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);
            let resMessages: OutputC = data.parameters.resMessages;

            let roles: Parse.Role[] = await new Parse.Query(Parse.Role).find().fail((e) => {
                throw e;
            });

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let role = roles.find((value1, index1, array1) => {
                            return value1.getName() === value.role;
                        });
                        if (!role) {
                            throw Errors.throw(Errors.CustomBadRequest, ['role not found']);
                        }

                        if (value.email) {
                            if (!Regex.IsEmail(value.email)) {
                                throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
                            }
                        }
                        if (value.phone) {
                            if (!Regex.IsInternationalPhone(value.phone)) {
                                throw Errors.throw(Errors.CustomBadRequest, ['phone format error']);
                            }
                        }

                        let user: Parse.User = new Parse.User();

                        user = await user.signUp({ username: value.account, password: value.password, roles: [role] }, { useMasterKey: true }).fail((e) => {
                            throw Errors.throw(Errors.CustomBadRequest, [e.message]);
                        });

                        resMessages[index].objectId = user.id;

                        let info: IDB.UserInfo = new IDB.UserInfo();

                        info.setValue('user', user);
                        info.setValue('name', value.name);
                        info.setValue('email', value.email);
                        info.setValue('phone', value.phone);

                        await info.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            return resMessages;
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
        middlewares: [Middleware.PagingRequestDefaultValue],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _paging: IRequest.IPaging = _input.paging;

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

            let query: Parse.Query<IDB.UserInfo> = new Parse.Query(IDB.UserInfo).containedIn('user', users);

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let infos: IDB.UserInfo[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include(['user', 'user.roles'])
                .find()
                .fail((e) => {
                    throw e;
                });

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _paging.page,
                    pageSize: _paging.pageSize,
                },
                results: infos.map((value, index, array) => {
                    return {
                        objectId: value.getValue('user').id,
                        account: value.getValue('user').getUsername(),
                        role: value
                            .getValue('user')
                            .get('roles')
                            .map((value1, index1, array1) => {
                                return Object.keys(RoleList).find((value2, index2, array2) => {
                                    return value1.get('name') === RoleList[value2];
                                });
                            })[0],
                        name: value.getValue('name'),
                        email: value.getValue('email'),
                        phone: value.getValue('phone'),
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
type InputU = IRequest.IUser.IUserIndexU[];

type OutputU = IResponse.IMultiData[];

action.put(
    {
        inputType: 'MultiData',
        permission: [RoleList.Admin],
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);
            let resMessages: OutputU = data.parameters.resMessages;

            let roles: Parse.Role[] = await new Parse.Query(Parse.Role).find().fail((e) => {
                throw e;
            });

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let role = roles.find((value1, index1, array1) => {
                            return value1.getName() === value.role;
                        });
                        if (!role) {
                            throw Errors.throw(Errors.CustomBadRequest, ['role not found']);
                        }

                        if (value.email) {
                            if (!Regex.IsEmail(value.email)) {
                                throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
                            }
                        }
                        if (value.phone) {
                            if (!Regex.IsInternationalPhone(value.phone)) {
                                throw Errors.throw(Errors.CustomBadRequest, ['phone format error']);
                            }
                        }

                        let user: Parse.User = await new Parse.Query(Parse.User)
                            .include('roles')
                            .get(value.objectId)
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

                        if (value.role) {
                            user.set('roles', [role]);
                        }
                        if (value.password) {
                            user.setPassword(value.password);
                        }
                        if (value.name) {
                            info.setValue('name', value.name);
                        }
                        if (value.email) {
                            info.setValue('email', value.email);
                        }
                        if (value.phone) {
                            info.setValue('phone', value.phone);
                        }

                        await user.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        await info.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            return resMessages;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IDelete;

type OutputD = IResponse.IMultiData[];

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.Admin],
        middlewares: [Middleware.MultiDataFromQuery],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _objectIds: string[] = data.parameters.objectIds;
            let resMessages: OutputD = data.parameters.resMessages;

            let users: Parse.User[] = _objectIds.map((value, index, array) => {
                let user: Parse.User = new Parse.User();
                user.id = value;

                return user;
            });

            let userInfos: IDB.UserInfo[] = await new Parse.Query(IDB.UserInfo)
                .containedIn('user', users)
                .include('user')
                .find()
                .fail((e) => {
                    throw e;
                });

            await Promise.all(
                userInfos.map(async (value, index, array) => {
                    try {
                        await value
                            .getValue('user')
                            .destroy({ useMasterKey: true })
                            .fail((e) => {
                                throw e;
                            });
                        await value.destroy({ useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        let i: number = _objectIds.indexOf(value.getValue('user').id);
                        resMessages[i] = Parser.E2ResMessage(e, resMessages[i]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            return resMessages;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

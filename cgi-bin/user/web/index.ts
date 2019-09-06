import { IUser, Action, Restful, RoleList, Errors, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Regex, Db, Permission, Utility, Email } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { permissionMapC, permissionMapR, permissionMapU, permissionMapD } from '../../../define/userRoles/userPermission.define';

let action = new Action({
    loginRequired: true,
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Create
 */
type InputC = IRequest.IUser.IWebIndexC[];

type OutputC = IResponse.IMultiData;

action.post(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.Administrator, RoleList.TenantAdministrator],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

            let roles: Parse.Role[] = await new Parse.Query(Parse.Role).find().fail((e) => {
                throw e;
            });

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapC);
                        Permission.ValidateRoles(availableRoles, [value.role]);

                        let role = roles.find((value1, index1, array1) => {
                            return value1.getName() === value.role;
                        });
                        if (!role) {
                            throw Errors.throw(Errors.CustomBadRequest, ['role not found']);
                        }

                        if (!value.password || value.password.length === 0) {
                            throw Errors.throw(Errors.CustomBadRequest, ['password can not be empty']);
                        }

                        if (!Regex.IsEmail(value.email)) {
                            throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
                        }
                        if (value.phone && !Regex.IsInternationalPhone(value.phone)) {
                            throw Errors.throw(Errors.CustomBadRequest, ['phone format error']);
                        }

                        let user: Parse.User = new Parse.User();

                        user = await user.signUp({ username: value.username, password: value.password, roles: [role] }, { useMasterKey: true }).fail((e) => {
                            throw Errors.throw(Errors.CustomBadRequest, [e.message]);
                        });

                        resMessages[index].objectId = user.id;

                        let info: IDB.UserInfo = new IDB.UserInfo();

                        info.setValue('user', user);
                        info.setValue('roles', [role]);
                        info.setValue('account', value.username);
                        info.setValue('name', value.name);
                        info.setValue('email', value.email);
                        info.setValue('phone', value.phone || '');
                        info.setValue('mobileType', Enum.EMobileType.none);
                        info.setValue('mobileToken', '');

                        await info.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Utility.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            return {
                datas: resMessages,
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

type OutputR = IResponse.IDataList<IResponse.IUser.IWebIndexR> | IResponse.IUser.IWebIndexR;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
        permission: [RoleList.Administrator, RoleList.TenantAdministrator],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            let roleLists: RoleList[] = Permission.GetUnavailableRoleLists(_userInfo.roleLists, permissionMapR);
            let roles: Parse.Role[] = await new Parse.Query(Parse.Role)
                .containedIn('name', roleLists)
                .find()
                .fail((e) => {
                    throw e;
                });

            let query: Parse.Query<IDB.UserInfo> = new Parse.Query(IDB.UserInfo);

            if ('keyword' in _input) {
                let query1 = new Parse.Query(IDB.UserInfo).matches('account', new RegExp(_input.keyword), 'i');
                let query2 = new Parse.Query(IDB.UserInfo).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1, query2);
            }

            query.notContainedIn('roles', roles);

            if ('objectId' in _input) {
                let user: Parse.User = new Parse.User();
                user.id = _input.objectId;

                query.equalTo('user', user);
            }

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

            let results = infos.map<IResponse.IUser.IWebIndexR>((value, index, array) => {
                let roles = value
                    .getValue('user')
                    .get('roles')
                    .map((value1, index1, array1) => {
                        return Object.keys(RoleList).find((value2, index2, array2) => {
                            return value1.get('name') === RoleList[value2];
                        });
                    });

                return {
                    objectId: value.getValue('user').id,
                    username: value.getValue('user').getUsername(),
                    role: roles[0],
                    name: value.getValue('name') || '',
                    email: value.getValue('email') || '',
                    phone: value.getValue('phone') || '',
                    remark: value.getValue('remark') || '',
                    webLestUseDate: value.getValue('webLestUseDate'),
                };
            });

            if ('objectId' in _input) {
                if (results.length === 0) {
                    throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
                }

                return results[0];
            }

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _paging.page,
                    pageSize: _paging.pageSize,
                },
                results: results,
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
type InputU = IRequest.IUser.IWebIndexU[];

type OutputU = IResponse.IMultiData;

action.put(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.Administrator, RoleList.TenantAdministrator],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        if ('email' in value && !Regex.IsEmail(value.email)) {
                            throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
                        }
                        if ('phone' in value && !Regex.IsInternationalPhone(value.phone)) {
                            throw Errors.throw(Errors.CustomBadRequest, ['phone format error']);
                        }

                        let user: Parse.User = new Parse.User();
                        user.id = value.objectId;

                        let info: IDB.UserInfo = await new Parse.Query(IDB.UserInfo)
                            .equalTo('user', user)
                            .include(['user', 'user.roles'])
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!info) {
                            throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
                        }

                        user = info.getValue('user');

                        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapU);
                        Permission.ValidateRoles(availableRoles, user.get('roles'));

                        if ('name' in value) {
                            info.setValue('name', value.name);
                        }
                        if ('email' in value) {
                            info.setValue('email', value.email);
                        }
                        if ('phone' in value) {
                            info.setValue('phone', value.phone);
                        }
                        if ('remark' in value) {
                            info.setValue('remark', value.remark);
                        }

                        await info.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Utility.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            return {
                datas: resMessages,
            };
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

type OutputD = IResponse.IMultiData;

action.delete(
    {
        inputType: 'InputD',
        middlewares: [Middleware.MultiDataFromQuery],
        permission: [RoleList.Administrator, RoleList.TenantAdministrator],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _objectIds: string[] = data.parameters.objectIds;
            let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

            await Promise.all(
                _objectIds.map(async (value, index, array) => {
                    try {
                        let user: Parse.User = new Parse.User();
                        user.id = value;

                        let info: IDB.UserInfo = await new Parse.Query(IDB.UserInfo)
                            .equalTo('user', user)
                            .include(['user', 'user.roles'])
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!info) {
                            throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
                        }

                        user = info.getValue('user');

                        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapD);
                        Permission.ValidateRoles(availableRoles, user.get('roles'));

                        await Promise.all([user.destroy({ useMasterKey: true }), info.destroy({ useMasterKey: true })]).catch((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Utility.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            return {
                datas: resMessages,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

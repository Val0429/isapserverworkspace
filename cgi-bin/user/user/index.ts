import { IUser, Action, Restful, RoleList, Errors, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Regex, Parser, Db, Permission, Utility, Email } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { permissionMapC, permissionMapR, permissionMapU, permissionMapD } from '../../../define/userRoles/userPermission.define';
import { default as DataCenter } from '../../../custom/services/data-center';

let action = new Action({
    loginRequired: true,
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Create
 */
type InputC = IRequest.IUser.IUserIndexC[];

type OutputC = IResponse.IMultiData;

action.post(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
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

                        if (value.employeeId === '') {
                            throw Errors.throw(Errors.CustomBadRequest, ['employee id can not be empty']);
                        }

                        let info: IDB.UserInfo = await new Parse.Query(IDB.UserInfo)
                            .equalTo('customId', value.employeeId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (info) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate employee id']);
                        }

                        if (!Regex.IsEmail(value.email)) {
                            throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
                        }
                        if (value.phone && !Regex.IsInternationalPhone(value.phone)) {
                            throw Errors.throw(Errors.CustomBadRequest, ['phone format error']);
                        }

                        let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
                            .containedIn('objectId', value.siteIds)
                            .find()
                            .fail((e) => {
                                throw e;
                            });

                        let groups: IDB.UserGroup[] = await new Parse.Query(IDB.UserGroup)
                            .containedIn('objectId', value.groupIds)
                            .find()
                            .fail((e) => {
                                throw e;
                            });

                        let user: Parse.User = new Parse.User();

                        user = await user.signUp({ username: value.username, password: value.password, roles: [role] }, { useMasterKey: true }).fail((e) => {
                            throw Errors.throw(Errors.CustomBadRequest, [e.message]);
                        });

                        resMessages[index].objectId = user.id;

                        info = new IDB.UserInfo();

                        let now: Date = new Date();

                        info.setValue('user', user);
                        info.setValue('account', value.username);
                        info.setValue('name', value.name);
                        info.setValue('customId', value.employeeId);
                        info.setValue('email', value.email);
                        info.setValue('phone', value.phone || '');
                        info.setValue('mobileType', Enum.EMobileType.none);
                        info.setValue('mobileToken', '');
                        info.setValue('isEmail', true);
                        info.setValue('isPhone', true);
                        info.setValue('isNotice', true);
                        info.setValue('sites', sites);
                        info.setValue('groups', groups);
                        info.setValue('enableVerification', Utility.RandomText(30, { symbol: false }));
                        info.setValue('enableExpireDate', new Date(new Date(now.setDate(now.getDate() + Config.expired.userEnableVerificationHour))));

                        await info.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        let setting = DataCenter.emailSetting$.value;

                        let email: Email = new Email();
                        email.config = {
                            host: setting.host,
                            port: setting.port,
                            email: setting.email,
                            password: setting.password,
                        };

                        email.Initialization();

                        let title: string = 'Action required to activate membership & change password for BAR system';
                        let content: string = info.getValue('enableVerification');

                        let result = await email.Send(title, content, {
                            tos: [info.getValue('email')],
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

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

type OutputR = IResponse.IDataList<IResponse.IUser.IUserIndexR>;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
        permission: [RoleList.SuperAdministrator, RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            let roleLists: RoleList[] = [RoleList.SystemAdministrator];
            if (_userInfo.roleLists.indexOf(RoleList.SuperAdministrator) < 0) {
                roleLists.push(RoleList.SuperAdministrator);
            }
            let roleExcludes: Parse.Role[] = await new Parse.Query(Parse.Role)
                .containedIn('name', roleLists)
                .find()
                .fail((e) => {
                    throw e;
                });

            let userExcludes: Parse.User[] = await new Parse.Query(Parse.User)
                .containedIn('roles', roleExcludes)
                .find()
                .fail((e) => {
                    throw e;
                });

            let query: Parse.Query<IDB.UserInfo> = new Parse.Query(IDB.UserInfo);

            if (_input.keyword) {
                let query1 = new Parse.Query(IDB.UserInfo).matches('account', new RegExp(_input.keyword), 'i');
                let query2 = new Parse.Query(IDB.UserInfo).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1, query2);
            }

            query.notContainedIn('user', userExcludes);

            if (_input.objectId) {
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
                .include(['user', 'user.roles', 'sites', 'groups'])
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
                    let roles = value
                        .getValue('user')
                        .get('roles')
                        .map((value1, index1, array1) => {
                            return Object.keys(RoleList).find((value2, index2, array2) => {
                                return value1.get('name') === RoleList[value2];
                            });
                        });

                    let sites = (value.getValue('sites') || []).map((value1, index1, array1) => {
                        return {
                            objectId: value1.id,
                            name: value1.getValue('name'),
                        };
                    });

                    let groups = (value.getValue('groups') || []).map((value1, index1, array1) => {
                        return {
                            objectId: value1.id,
                            name: value1.getValue('name'),
                        };
                    });

                    return {
                        objectId: value.getValue('user').id,
                        username: value.getValue('user').getUsername(),
                        role: roles[0],
                        name: value.getValue('name') || '',
                        employeeId: value.getValue('customId') || '',
                        email: value.getValue('email') || '',
                        phone: value.getValue('phone') || '',
                        webLestUseDate: value.getValue('webLestUseDate'),
                        appLastUseDate: value.getValue('appLastUseDate'),
                        sites: sites,
                        groups: groups,
                        isAppBinding: !!value.getValue('mobileType') && value.getValue('mobileType') !== Enum.EMobileType.none,
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

type OutputU = IResponse.IMultiData;

action.put(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

            let roles: Parse.Role[] = await new Parse.Query(Parse.Role).find().fail((e) => {
                throw e;
            });

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        if (value.email && !Regex.IsEmail(value.email)) {
                            throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
                        }
                        if (value.phone && !Regex.IsInternationalPhone(value.phone)) {
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
                            throw Errors.throw(Errors.CustomBadRequest, ['info not found']);
                        }

                        let infoRoles = info
                            .getValue('user')
                            .get('roles')
                            .map((n) => n.getName());
                        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapU);
                        Permission.ValidateRoles(availableRoles, infoRoles);

                        if (value.role) {
                            let role = roles.find((value1, index1, array1) => {
                                return value1.getName() === value.role;
                            });
                            if (!role) {
                                throw Errors.throw(Errors.CustomBadRequest, ['role not found']);
                            }

                            user.set('roles', [role]);
                        }
                        if (value.name || value.name === '') {
                            info.setValue('name', value.name);
                        }
                        if (value.email || value.email === '') {
                            info.setValue('email', value.email);
                        }
                        if (value.phone || value.phone === '') {
                            info.setValue('phone', value.phone);
                        }
                        if (value.siteIds) {
                            let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
                                .containedIn('objectId', value.siteIds)
                                .find()
                                .fail((e) => {
                                    throw e;
                                });

                            info.setValue('sites', sites);
                        }
                        if (value.groupIds) {
                            let groups: IDB.UserGroup[] = await new Parse.Query(IDB.UserGroup)
                                .containedIn('objectId', value.groupIds)
                                .find()
                                .fail((e) => {
                                    throw e;
                                });

                            info.setValue('groups', groups);
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
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
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
                            throw Errors.throw(Errors.CustomBadRequest, ['info not found']);
                        }

                        let infoRoles = info
                            .getValue('user')
                            .get('roles')
                            .map((n) => n.getName());
                        let availableRoles: RoleList[] = Permission.GetAvailableRoles(data.role, permissionMapD);
                        Permission.ValidateRoles(availableRoles, infoRoles);

                        await info
                            .getValue('user')
                            .destroy({ useMasterKey: true })
                            .fail((e) => {
                                throw e;
                            });
                        await info.destroy({ useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

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
 * Unbinding when user group was delete
 */
IDB.UserGroup.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let userInfos: IDB.UserInfo[] = await new Parse.Query(IDB.UserInfo)
                    .containedIn('groups', [x.data])
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    userInfos.map(async (value, index, array) => {
                        let groups: IDB.UserGroup[] = value.getValue('groups').filter((value1, index1, array1) => {
                            return value1.id !== x.data.id;
                        });
                        value.setValue('groups', groups);

                        await value.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    }),
                );
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });

/**
 * Unbinding when site was delete
 */
IDB.LocationSite.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let userInfos: IDB.UserInfo[] = await new Parse.Query(IDB.UserInfo)
                    .containedIn('sites', [x.data])
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    userInfos.map(async (value, index, array) => {
                        let sites: IDB.LocationSite[] = value.getValue('sites').filter((value1, index1, array1) => {
                            return value1.id !== x.data.id;
                        });
                        value.setValue('sites', sites);

                        await value.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    }),
                );
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });

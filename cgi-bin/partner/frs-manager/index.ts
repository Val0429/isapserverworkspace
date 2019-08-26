import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Utility, FRSManagerService } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import SourceFRSManager from '../../../custom/services/source-frs-manager';

let action = new Action({
    loginRequired: true,
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Create
 */
type InputC = IRequest.IPartner.IFRSManagerC[];

type OutputC = IResponse.IMultiData;

action.post(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);
        let _userInfo = await Db.GetUserInfo(data.request, data.user);

        try {
            let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let devices = await GetDeviceList(value);

                        let server: IDB.ServerFRSManager = await new Parse.Query(IDB.ServerFRSManager)
                            .equalTo('customId', value.customId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate custom id']);
                        }

                        server = await new Parse.Query(IDB.ServerFRSManager)
                            .equalTo('ip', value.ip)
                            .equalTo('port', value.port)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate server']);
                        }

                        server = new IDB.ServerFRSManager();

                        server.setValue('customId', value.customId);
                        server.setValue('name', value.name);
                        server.setValue('protocol', value.protocol);
                        server.setValue('ip', value.ip);
                        server.setValue('port', value.port);
                        server.setValue('account', value.account);
                        server.setValue('password', value.password);
                        server.setValue('userGroups', value.userGroups);

                        await server.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = server.id;
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

type OutputR = IResponse.IDataList<IResponse.IPartner.IFRSManagerR>;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            let query: Parse.Query<IDB.ServerFRSManager> = new Parse.Query(IDB.ServerFRSManager);

            if (_input.keyword) {
                let query1 = new Parse.Query(IDB.ServerFRSManager).matches('name', new RegExp(_input.keyword), 'i');
                let query2 = new Parse.Query(IDB.ServerFRSManager).matches('ip', new RegExp(_input.keyword), 'i');
                let query3 = new Parse.Query(IDB.ServerFRSManager).matches('customId', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1, query2, query3);
            }

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let servers: IDB.ServerFRSManager[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
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
                results: servers.map((value, index, array) => {
                    let userGroups = value.getValue('userGroups').map((value1, index1, array1) => {
                        return {
                            type: Enum.EPeopleType[value1.type],
                            objectId: value1.objectId,
                            name: value1.name,
                        };
                    });

                    return {
                        objectId: value.id,
                        customId: value.getValue('customId'),
                        name: value.getValue('name'),
                        protocol: value.getValue('protocol'),
                        ip: value.getValue('ip'),
                        port: value.getValue('port'),
                        account: value.getValue('account'),
                        password: value.getValue('password'),
                        userGroups: userGroups,
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
type InputU = IRequest.IPartner.IFRSManagerU[];

type OutputU = IResponse.IMultiData;

action.put(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);
        let _userInfo = await Db.GetUserInfo(data.request, data.user);

        try {
            let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let devices = await GetDeviceList(value);

                        let server: IDB.ServerFRSManager = await new Parse.Query(IDB.ServerFRSManager)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
                        }

                        if (value.ip !== server.getValue('ip') || value.port !== server.getValue('port')) {
                            let server: IDB.ServerFRSManager = await new Parse.Query(IDB.ServerFRSManager)
                                .equalTo('ip', value.ip)
                                .equalTo('port', value.port)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (server) {
                                throw Errors.throw(Errors.CustomBadRequest, ['duplicate server']);
                            }
                        }

                        if (value.name || value.name === '') {
                            server.setValue('name', value.name);
                        }
                        if (value.userGroups) {
                            server.setValue('userGroups', value.userGroups);
                        }
                        server.setValue('protocol', value.protocol);
                        server.setValue('ip', value.ip);
                        server.setValue('port', value.port);
                        server.setValue('account', value.account);
                        server.setValue('password', value.password);

                        await server.save(null, { useMasterKey: true }).fail((e) => {
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
                        let server: IDB.ServerFRSManager = await new Parse.Query(IDB.ServerFRSManager)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
                        }

                        await server.destroy({ useMasterKey: true }).fail((e) => {
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
 * Get device list
 * @param config
 */
export async function GetDeviceList(config: FRSManagerService.IConfig): Promise<FRSManagerService.IFRSDeviceTree[]> {
    try {
        let frsManager: FRSManagerService = SourceFRSManager.frsManagers.find((value, index, array) => {
            return value.config.ip === config.ip && value.config.port === config.port;
        });
        if (!frsManager) {
            frsManager = new FRSManagerService();
            frsManager.config = config;

            frsManager.Initialization();

            await frsManager.Login();
        }

        let devices = await frsManager.GetDeviceTree();

        return devices;
    } catch (e) {
        throw Errors.throw(Errors.CustomBadRequest, [e]);
    }
}

/**
 * Get user group
 * @param config
 */
export async function GetUserGroup(config: FRSManagerService.IConfig): Promise<FRSManagerService.IObject[]> {
    try {
        let frsManager: FRSManagerService = SourceFRSManager.frsManagers.find((value, index, array) => {
            return value.config.ip === config.ip && value.config.port === config.port;
        });
        if (!frsManager) {
            frsManager = new FRSManagerService();
            frsManager.config = config;

            frsManager.Initialization();

            await frsManager.Login();
        }

        let groups = await frsManager.GetUserGroups();

        return groups;
    } catch (e) {
        throw Errors.throw(Errors.CustomBadRequest, [e]);
    }
}
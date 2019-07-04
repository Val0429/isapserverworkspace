import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Parser, FRSService } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import FRS from '../../../custom/services/frs';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Create
 */
type InputC = IRequest.IPartner.IFRSC[];

type OutputC = IResponse.IMultiData[];

action.post(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);
        let _userInfo = await Db.GetUserInfo(data.request, data.user);

        try {
            let resMessages: OutputC = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let devices = await GetDeviceList(value);

                        let server: IDB.ServerFRS = await new Parse.Query(IDB.ServerFRS)
                            .equalTo('customId', value.customId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate custom id']);
                        }

                        server = await new Parse.Query(IDB.ServerFRS)
                            .equalTo('ip', value.ip)
                            .equalTo('port', value.port)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate server']);
                        }

                        server = new IDB.ServerFRS();

                        server.setValue('customId', value.customId);
                        server.setValue('name', value.name);
                        server.setValue('protocol', value.protocol);
                        server.setValue('ip', value.ip);
                        server.setValue('port', value.port);
                        server.setValue('wsport', value.wsport);
                        server.setValue('account', value.account);
                        server.setValue('password', value.password);
                        server.setValue('userGroups', value.userGroups);

                        await server.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = server.id;
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

type OutputR = IResponse.IDataList<IResponse.IPartner.IFRSR>;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            let query: Parse.Query<IDB.ServerFRS> = new Parse.Query(IDB.ServerFRS);

            if (_input.keyword) {
                let query1 = new Parse.Query(IDB.ServerFRS).matches('name', new RegExp(_input.keyword), 'i');
                let query2 = new Parse.Query(IDB.ServerFRS).matches('ip', new RegExp(_input.keyword), 'i');
                let query3 = new Parse.Query(IDB.ServerFRS).matches('customId', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1, query2, query3);
            }

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let servers: IDB.ServerFRS[] = await query
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
                    return {
                        objectId: value.id,
                        customId: value.getValue('customId'),
                        name: value.getValue('name'),
                        protocol: value.getValue('protocol'),
                        ip: value.getValue('ip'),
                        port: value.getValue('port'),
                        wsport: value.getValue('wsport'),
                        account: value.getValue('account'),
                        password: value.getValue('password'),
                        userGroups: value.getValue('userGroups'),
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
type InputU = IRequest.IPartner.IFRSU[];

type OutputU = IResponse.IMultiData[];

action.put(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);
        let _userInfo = await Db.GetUserInfo(data.request, data.user);

        try {
            let resMessages: OutputU = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let devices = await GetDeviceList(value);

                        let server: IDB.ServerFRS = await new Parse.Query(IDB.ServerFRS)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
                        }

                        if (value.ip !== server.getValue('ip') || value.port !== server.getValue('port')) {
                            let server: IDB.ServerFRS = await new Parse.Query(IDB.ServerFRS)
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
                        server.setValue('wsport', value.wsport);
                        server.setValue('account', value.account);
                        server.setValue('password', value.password);

                        await server.save(null, { useMasterKey: true }).fail((e) => {
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
        middlewares: [Middleware.MultiDataFromQuery],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _objectIds: string[] = data.parameters.objectIds;
            let resMessages: OutputD = data.parameters.resMessages;

            await Promise.all(
                _objectIds.map(async (value, index, array) => {
                    try {
                        let server: IDB.ServerFRS = await new Parse.Query(IDB.ServerFRS)
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
 * Get device list
 * @param config
 */
export async function GetDeviceList(config: FRSService.IConfig): Promise<FRSService.IDevice[]> {
    try {
        let frs: FRSService = FRS.frss.find((value, index, array) => {
            return value.config.ip === config.ip && value.config.port === config.port;
        });
        if (!frs) {
            frs = new FRSService();
            frs.config = config;

            frs.Initialization();

            await frs.Login();
        }

        let devices = await frs.GetDeviceList();

        return devices;
    } catch (e) {
        throw Errors.throw(Errors.CustomBadRequest, [e]);
    }
}

/**
 * Get user group
 * @param config
 */
export async function GetUserGroup(config: FRSService.IConfig): Promise<FRSService.IObject[]> {
    try {
        let frs: FRSService = FRS.frss.find((value, index, array) => {
            return value.config.ip === config.ip && value.config.port === config.port;
        });
        if (!frs) {
            frs = new FRSService();
            frs.config = config;

            frs.Initialization();

            await frs.Login();
        }

        let groups = await frs.GetUserGroups();

        return groups;
    } catch (e) {
        throw Errors.throw(Errors.CustomBadRequest, [e]);
    }
}

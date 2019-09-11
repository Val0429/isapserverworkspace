import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Db, FRS } from '../../../custom/helpers';
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
type InputC = IRequest.IClient.IFRSIndexC[];

type OutputC = IResponse.IMultiData;

action.post(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.SystemAdministrator, RoleList.Administrator],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        if (_input.findIndex((n) => n.name === value.name) !== index) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate frs name']);
                        }

                        try {
                            await Login({
                                protocol: value.protocol,
                                ip: value.ip,
                                port: value.port,
                                wsport: value.port,
                                account: value.account,
                                password: value.password,
                            });
                        } catch (e) {
                            throw `frs: ${e}`;
                        }

                        let floor: IDB.LocationFloors = await new Parse.Query(IDB.LocationFloors)
                            .equalTo('objectId', value.floorId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!floor) {
                            throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
                        }

                        let frs: IDB.ClientFRS = await new Parse.Query(IDB.ClientFRS)
                            .equalTo('name', value.name)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!!frs) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate frs name']);
                        }

                        frs = new IDB.ClientFRS();

                        frs.setValue('floor', floor);
                        frs.setValue('name', value.name);
                        frs.setValue('protocol', value.protocol);
                        frs.setValue('ip', value.ip);
                        frs.setValue('port', value.port);
                        frs.setValue('account', value.account);
                        frs.setValue('password', value.password);

                        await frs.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = frs.id;
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

type OutputR = IResponse.IDataList<IResponse.IClient.IFRSIndexR> | IResponse.IClient.IFRSIndexR;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
        permission: [RoleList.SystemAdministrator, RoleList.Administrator],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            let query: Parse.Query<IDB.ClientFRS> = new Parse.Query(IDB.ClientFRS);

            if ('keyword' in _input) {
                let query1 = new Parse.Query(IDB.ClientFRS).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if ('objectId' in _input) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let frss: IDB.ClientFRS[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include('floor')
                .find()
                .fail((e) => {
                    throw e;
                });

            let results = frss.map<IResponse.IClient.IFRSIndexR>((value, index, array) => {
                let _floor: IResponse.IObject = {
                    objectId: value.getValue('floor').id,
                    name: value.getValue('floor').getValue('name'),
                };

                return {
                    objectId: value.id,
                    floor: _floor,
                    name: value.getValue('name'),
                    protocol: value.getValue('protocol'),
                    ip: value.getValue('ip'),
                    port: value.getValue('port'),
                    account: value.getValue('account'),
                    password: value.getValue('password'),
                };
            });

            if ('objectId' in _input) {
                if (results.length === 0) {
                    throw Errors.throw(Errors.CustomBadRequest, ['building not found']);
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
type InputU = IRequest.IClient.IFRSIndexU[];

type OutputU = IResponse.IMultiData;

action.put(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.SystemAdministrator, RoleList.Administrator],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let frs: IDB.ClientFRS = await new Parse.Query(IDB.ClientFRS)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!frs) {
                            throw Errors.throw(Errors.CustomBadRequest, ['frs not found']);
                        }

                        if ('floorId' in value) {
                            let floor: IDB.LocationFloors = await new Parse.Query(IDB.LocationFloors)
                                .equalTo('objectId', value.floorId)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!floor) {
                                throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
                            }

                            frs.setValue('floor', floor);
                        }
                        if ('protocol' in value) {
                            frs.setValue('protocol', value.protocol);
                        }
                        if ('ip' in value) {
                            frs.setValue('ip', value.ip);
                        }
                        if ('port' in value) {
                            frs.setValue('port', value.port);
                        }
                        if ('account' in value) {
                            frs.setValue('account', value.account);
                        }
                        if ('password' in value) {
                            frs.setValue('password', value.password);
                        }

                        try {
                            await Login({
                                protocol: frs.getValue('protocol'),
                                ip: frs.getValue('ip'),
                                port: frs.getValue('port'),
                                wsport: frs.getValue('port'),
                                account: frs.getValue('account'),
                                password: frs.getValue('password'),
                            });
                        } catch (e) {
                            throw `frs: ${e}`;
                        }

                        await frs.save(null, { useMasterKey: true }).fail((e) => {
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator],
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
                        let frs: IDB.ClientFRS = await new Parse.Query(IDB.ClientFRS)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!frs) {
                            throw Errors.throw(Errors.CustomBadRequest, ['frs not found']);
                        }

                        await frs.destroy({ useMasterKey: true }).fail((e) => {
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
 * Login
 * @param config
 */
export async function Login(config: FRS.IConfig): Promise<FRS> {
    try {
        let frs: FRS = new FRS();
        frs.config = config;

        frs.Initialization();

        await frs.Login();

        return frs;
    } catch (e) {
        throw e;
    }
}

/**
 * Get device list
 * @param config
 */
export async function GetDeviceList(config: FRS.IConfig): Promise<FRS.IDevice[]> {
    try {
        let frs: FRS = await Login(config);

        let devices = await frs.GetDeviceList();

        return devices;
    } catch (e) {
        throw e;
    }
}

/**
 * Delete when floor was delete
 */
IDB.LocationFloors.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let frs: IDB.ClientFRS[] = await new Parse.Query(IDB.ClientFRS)
                    .equalTo('floor', x.data)
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    frs.map(async (value, index, array) => {
                        await value.destroy({ useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    }),
                );
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });

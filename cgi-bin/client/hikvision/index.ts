import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Db, HikVision } from '../../../custom/helpers';
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
type InputC = IRequest.IClient.IHikVisionIndexC[];

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
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate hik vision name']);
                        }

                        try {
                            await GetDeviceStatus({
                                ipAddress: value.ip,
                                port: value.port.toString(),
                                account: value.account,
                                password: value.password,
                            });
                        } catch (e) {
                            throw `hikvision: ${e}`;
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

                        let hikVision: IDB.ClientHikVision = await new Parse.Query(IDB.ClientHikVision)
                            .equalTo('name', value.name)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!!hikVision) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate hik vision name']);
                        }

                        hikVision = new IDB.ClientHikVision();

                        hikVision.setValue('floor', floor);
                        hikVision.setValue('name', value.name);
                        hikVision.setValue('protocol', value.protocol);
                        hikVision.setValue('ip', value.ip);
                        hikVision.setValue('port', value.port);
                        hikVision.setValue('account', value.account);
                        hikVision.setValue('password', value.password);

                        await hikVision.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = hikVision.id;
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

type OutputR = IResponse.IDataList<IResponse.IClient.IHikVisionIndexR> | IResponse.IClient.IHikVisionIndexR;

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

            let query: Parse.Query<IDB.ClientHikVision> = new Parse.Query(IDB.ClientHikVision);

            if ('keyword' in _input) {
                let query1 = new Parse.Query(IDB.ClientHikVision).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if ('objectId' in _input) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let hikVisions: IDB.ClientHikVision[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include('floor')
                .find()
                .fail((e) => {
                    throw e;
                });

            let results = hikVisions.map<IResponse.IClient.IHikVisionIndexR>((value, index, array) => {
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
                    throw Errors.throw(Errors.CustomBadRequest, ['hikVision not found']);
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
type InputU = IRequest.IClient.IHikVisionIndexU[];

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
                        let hikVision: IDB.ClientHikVision = await new Parse.Query(IDB.ClientHikVision)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!hikVision) {
                            throw Errors.throw(Errors.CustomBadRequest, ['hik vision not found']);
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

                            hikVision.setValue('floor', floor);
                        }
                        if ('protocol' in value) {
                            hikVision.setValue('protocol', value.protocol);
                        }
                        if ('ip' in value) {
                            hikVision.setValue('ip', value.ip);
                        }
                        if ('port' in value) {
                            hikVision.setValue('port', value.port);
                        }
                        if ('account' in value) {
                            hikVision.setValue('account', value.account);
                        }
                        if ('password' in value) {
                            hikVision.setValue('password', value.password);
                        }

                        try {
                            await GetDeviceStatus({
                                ipAddress: hikVision.getValue('ip'),
                                port: hikVision.getValue('port').toString(),
                                account: hikVision.getValue('account'),
                                password: hikVision.getValue('password'),
                            });
                        } catch (e) {
                            throw `hikvision: ${e}`;
                        }

                        await hikVision.save(null, { useMasterKey: true }).fail((e) => {
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
                        let hikVision: IDB.ClientHikVision = await new Parse.Query(IDB.ClientHikVision)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!hikVision) {
                            throw Errors.throw(Errors.CustomBadRequest, ['hik vision not found']);
                        }

                        await hikVision.destroy({ useMasterKey: true }).fail((e) => {
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
export async function Login(config: HikVision.I_DeviceInfo): Promise<HikVision.Hikvision> {
    try {
        let hikVision = new HikVision.Hikvision();

        let deviceInfo: HikVision.I_DeviceInfo = config;

        let result = hikVision.createInstance(deviceInfo);
        if (!!result.result) {
            return hikVision;
        } else {
            throw result.errorMessage;
        }
    } catch (e) {
        throw e;
    }
}

/**
 * Get device status
 * @param config
 */
export async function GetDeviceStatus(config: HikVision.I_DeviceInfo): Promise<void> {
    let hikVision: HikVision.Hikvision = undefined;

    try {
        hikVision = await Login(config);

        let result = hikVision.checkDeviceStatus();
        if (!result.result) {
            throw result.errorMessage;
        }
    } catch (e) {
        throw e;
    } finally {
        if (!!hikVision) {
            hikVision.disposeInstance();
        }
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
                let hikVision: IDB.ClientHikVision[] = await new Parse.Query(IDB.ClientHikVision)
                    .equalTo('floor', x.data)
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    hikVision.map(async (value, index, array) => {
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

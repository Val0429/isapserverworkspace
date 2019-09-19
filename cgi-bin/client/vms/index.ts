import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Db, VMS } from '../../../custom/helpers';
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
type InputC = IRequest.IClient.IVMSIndexC[];

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
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate vms name']);
                        }

                        try {
                            await VMSService.Login({
                                protocol: value.protocol,
                                ip: value.ip,
                                port: value.port,
                                account: value.account,
                                password: value.password,
                            });
                        } catch (e) {
                            throw `vms: ${e}`;
                        }

                        let vms: IDB.ClientVMS = await new Parse.Query(IDB.ClientVMS)
                            .equalTo('name', value.name)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!!vms) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate vms name']);
                        }

                        vms = new IDB.ClientVMS();

                        vms.setValue('name', value.name);
                        vms.setValue('protocol', value.protocol);
                        vms.setValue('ip', value.ip);
                        vms.setValue('port', value.port);
                        vms.setValue('account', value.account);
                        vms.setValue('password', value.password);

                        await vms.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = vms.id;
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

type OutputR = IResponse.IDataList<IResponse.IClient.IVMSIndexR> | IResponse.IClient.IVMSIndexR;

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

            let query: Parse.Query<IDB.ClientVMS> = new Parse.Query(IDB.ClientVMS);

            if ('keyword' in _input) {
                let query1 = new Parse.Query(IDB.ClientVMS).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if ('objectId' in _input) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let vmss: IDB.ClientVMS[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include('floor')
                .find()
                .fail((e) => {
                    throw e;
                });

            let results = vmss.map<IResponse.IClient.IVMSIndexR>((value, index, array) => {
                return {
                    objectId: value.id,
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
                    throw Errors.throw(Errors.CustomBadRequest, ['vms not found']);
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
type InputU = IRequest.IClient.IVMSIndexU[];

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
                        let vms: IDB.ClientVMS = await new Parse.Query(IDB.ClientVMS)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!vms) {
                            throw Errors.throw(Errors.CustomBadRequest, ['vms not found']);
                        }

                        if ('protocol' in value) {
                            vms.setValue('protocol', value.protocol);
                        }
                        if ('ip' in value) {
                            vms.setValue('ip', value.ip);
                        }
                        if ('port' in value) {
                            vms.setValue('port', value.port);
                        }
                        if ('account' in value) {
                            vms.setValue('account', value.account);
                        }
                        if ('password' in value) {
                            vms.setValue('password', value.password);
                        }

                        try {
                            await VMSService.Login({
                                protocol: vms.getValue('protocol'),
                                ip: vms.getValue('ip'),
                                port: vms.getValue('port'),
                                account: vms.getValue('account'),
                                password: vms.getValue('password'),
                            });
                        } catch (e) {
                            throw `vms: ${e}`;
                        }

                        await vms.save(null, { useMasterKey: true }).fail((e) => {
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
                        let vms: IDB.ClientVMS = await new Parse.Query(IDB.ClientVMS)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!vms) {
                            throw Errors.throw(Errors.CustomBadRequest, ['vms not found']);
                        }

                        await vms.destroy({ useMasterKey: true }).fail((e) => {
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
 *
 */
namespace VMSService {
    /**
     * Login
     * @param config
     */
    export async function Login(config: VMS.IConfig): Promise<VMS> {
        try {
            let vms: VMS = new VMS();
            vms.config = config;

            vms.Initialization();

            await vms.Login();

            return vms;
        } catch (e) {
            throw e;
        }
    }
}

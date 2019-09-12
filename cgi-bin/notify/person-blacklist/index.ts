import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Db, Regex } from '../../../custom/helpers';
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
type InputC = IRequest.INotify.IPersonBlacklistC[];

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
                        if (!value.name) {
                            throw Errors.throw(Errors.CustomBadRequest, ['name can not be empty']);
                        }

                        if (!Regex.IsEmail(value.email)) {
                            throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
                        }

                        let notify: IDB.NotifyPersonBlacklist = new IDB.NotifyPersonBlacklist();

                        notify.setValue('name', value.name);
                        notify.setValue('position', value.position);
                        notify.setValue('phone', value.phone);
                        notify.setValue('email', value.email);
                        notify.setValue('remark', value.remark);

                        await notify.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = notify.id;
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

type OutputR = IResponse.IDataList<IResponse.INotify.IPersonBlacklistR> | IResponse.INotify.IPersonBlacklistR;

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

            let query: Parse.Query<IDB.NotifyPersonBlacklist> = new Parse.Query(IDB.NotifyPersonBlacklist);

            if ('keyword' in _input) {
                let query1 = new Parse.Query(IDB.NotifyPersonBlacklist).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if ('objectId' in _input) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let notifys: IDB.NotifyPersonBlacklist[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .find()
                .fail((e) => {
                    throw e;
                });

            let results = notifys.map<IResponse.INotify.IPersonBlacklistR>((value, index, array) => {
                return {
                    objectId: value.id,
                    name: value.getValue('name'),
                    position: value.getValue('position'),
                    phone: value.getValue('phone'),
                    email: value.getValue('email'),
                    remark: value.getValue('remark'),
                };
            });

            if ('objectId' in _input) {
                if (results.length === 0) {
                    throw Errors.throw(Errors.CustomBadRequest, ['notify not found']);
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
type InputU = IRequest.INotify.IPersonBlacklistU[];

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
                        let notify: IDB.NotifyPersonBlacklist = await new Parse.Query(IDB.NotifyPersonBlacklist)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!notify) {
                            throw Errors.throw(Errors.CustomBadRequest, ['notify not found']);
                        }

                        if ('name' in value) {
                            if (!value.name) {
                                throw Errors.throw(Errors.CustomBadRequest, ['name can not be empty']);
                            }

                            notify.setValue('name', value.name);
                        }
                        if ('position' in value) {
                            notify.setValue('position', value.position);
                        }
                        if ('phone' in value) {
                            notify.setValue('phone', value.phone);
                        }
                        if ('email' in value) {
                            if (!Regex.IsEmail(value.email)) {
                                throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
                            }

                            notify.setValue('email', value.email);
                        }
                        if ('remark' in value) {
                            notify.setValue('remark', value.remark);
                        }

                        await notify.save(null, { useMasterKey: true }).fail((e) => {
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
                        let notify: IDB.NotifyPersonBlacklist = await new Parse.Query(IDB.NotifyPersonBlacklist)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!notify) {
                            throw Errors.throw(Errors.CustomBadRequest, ['notify not found']);
                        }

                        await notify.destroy({ useMasterKey: true }).fail((e) => {
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

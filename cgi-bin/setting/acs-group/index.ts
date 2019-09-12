import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Db } from '../../../custom/helpers';
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
type InputC = IRequest.ISetting.IACSGroupC[];

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
                        if (_input.findIndex((n) => n.buildingId === value.buildingId) !== index) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate building']);
                        }

                        let building: IDB.LocationBuildings = await new Parse.Query(IDB.LocationBuildings)
                            .equalTo('objectId', value.buildingId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!building) {
                            throw Errors.throw(Errors.CustomBadRequest, ['building not found']);
                        }

                        let group: IDB.SettingACSGroup = await new Parse.Query(IDB.SettingACSGroup)
                            .equalTo('building', building)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!!group) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate building']);
                        }

                        group = new IDB.SettingACSGroup();

                        group.setValue('building', building);
                        group.setValue('group', value.group);

                        await group.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = group.id;
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

type OutputR = IResponse.IDataList<IResponse.ISetting.IACSGroupR> | IResponse.ISetting.IACSGroupR;

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

            let query: Parse.Query<IDB.SettingACSGroup> = new Parse.Query(IDB.SettingACSGroup);

            if ('objectId' in _input) {
                let building: IDB.LocationBuildings = await new Parse.Query(IDB.LocationBuildings)
                    .equalTo('objectId', _input.objectId)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!building) {
                    throw Errors.throw(Errors.CustomBadRequest, ['building not found']);
                }

                query.equalTo('building', building);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let groups: IDB.SettingACSGroup[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include('building')
                .find()
                .fail((e) => {
                    throw e;
                });

            let results = groups.map<IResponse.ISetting.IACSGroupR>((value, index, array) => {
                let _building: IResponse.IObject = {
                    objectId: value.getValue('building').id,
                    name: value.getValue('building').getValue('name'),
                };

                return {
                    objectId: value.id,
                    building: _building,
                    group: value.getValue('group'),
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
type InputU = IRequest.ISetting.IACSGroupU[];

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
                        let building: IDB.LocationBuildings = await new Parse.Query(IDB.LocationBuildings)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!building) {
                            throw Errors.throw(Errors.CustomBadRequest, ['building not found']);
                        }

                        let group: IDB.SettingACSGroup = await new Parse.Query(IDB.SettingACSGroup)
                            .equalTo('building', building)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!group) {
                            throw Errors.throw(Errors.CustomBadRequest, ['group not found']);
                        }

                        if ('group' in value) {
                            group.setValue('group', value.group);
                        }

                        await group.save(null, { useMasterKey: true }).fail((e) => {
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
                        let group: IDB.SettingACSGroup = await new Parse.Query(IDB.SettingACSGroup)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!group) {
                            throw Errors.throw(Errors.CustomBadRequest, ['group not found']);
                        }

                        await group.destroy({ useMasterKey: true }).fail((e) => {
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
 * Delete when building was delete
 */
IDB.LocationBuildings.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let groups: IDB.SettingACSGroup[] = await new Parse.Query(IDB.SettingACSGroup)
                    .equalTo('building', x.data)
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    groups.map(async (value, index, array) => {
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

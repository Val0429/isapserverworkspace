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
type InputC = IRequest.ILocation.IFloorsIndexC[];

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
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate floor name']);
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

                        let floor: IDB.LocationFloors = await new Parse.Query(IDB.LocationFloors)
                            .equalTo('name', value.name)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!!floor) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate floor name']);
                        }

                        floor = new IDB.LocationFloors();

                        floor.setValue('building', building);
                        floor.setValue('name', value.name);
                        floor.setValue('floor', value.floor);

                        await floor.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = floor.id;
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
type InputR = IRequest.IDataList & IRequest.ILocation.IFloorsIndexR;

type OutputR = IResponse.IDataList<IResponse.ILocation.IFloorsIndexR> | IResponse.ILocation.IFloorsIndexR;

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

            let query: Parse.Query<IDB.LocationFloors> = new Parse.Query(IDB.LocationFloors);

            if ('keyword' in _input) {
                let query1 = new Parse.Query(IDB.LocationFloors).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if ('buildingId' in _input) {
                let building: IDB.LocationBuildings = await new Parse.Query(IDB.LocationBuildings)
                    .equalTo('objectId', _input.buildingId)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!building) {
                    throw Errors.throw(Errors.CustomBadRequest, ['building not found']);
                }

                query.equalTo('building', building);
            }

            if ('objectId' in _input) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let floors: IDB.LocationFloors[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include('building')
                .find()
                .fail((e) => {
                    throw e;
                });

            let results = floors.map<IResponse.ILocation.IFloorsIndexR>((value, index, array) => {
                let _building: IResponse.IObject = {
                    objectId: value.getValue('building').id,
                    name: value.getValue('building').getValue('name'),
                };

                return {
                    objectId: value.id,
                    name: value.getValue('name'),
                    building: _building,
                    floor: value.getValue('floor'),
                };
            });

            if ('objectId' in _input) {
                if (results.length === 0) {
                    throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
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
type InputU = IRequest.ILocation.IFloorsIndexU[];

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
                        let floor: IDB.LocationFloors = await new Parse.Query(IDB.LocationFloors)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!floor) {
                            throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
                        }

                        if ('name' in value) {
                            let _floor: IDB.LocationFloors = await new Parse.Query(IDB.LocationFloors)
                                .notEqualTo('objectId', value.objectId)
                                .equalTo('name', value.name)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!!_floor) {
                                throw Errors.throw(Errors.CustomBadRequest, ['duplicate floor name']);
                            }

                            floor.setValue('name', value.name);
                        }
                        if ('buildingId' in value) {
                            let building: IDB.LocationBuildings = await new Parse.Query(IDB.LocationBuildings)
                                .equalTo('objectId', value.buildingId)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!building) {
                                throw Errors.throw(Errors.CustomBadRequest, ['building not found']);
                            }

                            floor.setValue('building', building);
                        }
                        if ('floor' in value) {
                            floor.setValue('floor', value.floor);
                        }

                        await floor.save(null, { useMasterKey: true }).fail((e) => {
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
                        let floor: IDB.LocationFloors = await new Parse.Query(IDB.LocationFloors)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!floor) {
                            throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
                        }

                        await floor.destroy({ useMasterKey: true }).fail((e) => {
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
                let floors: IDB.LocationFloors[] = await new Parse.Query(IDB.LocationFloors)
                    .equalTo('building', x.data)
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    floors.map(async (value, index, array) => {
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

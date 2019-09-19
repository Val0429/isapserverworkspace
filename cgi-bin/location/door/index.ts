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
type InputC = IRequest.ILocation.IDoorIndexC[];

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
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate door name']);
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

                        let company: IDB.LocationCompanies = undefined;
                        if ('companyId' in value) {
                            company = await new Parse.Query(IDB.LocationCompanies)
                                .equalTo('objectId', value.companyId)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!company) {
                                throw Errors.throw(Errors.CustomBadRequest, ['company not found']);
                            }

                            let floorIds: string[] = company.getValue('floor').map((value1, index1, array1) => {
                                return value1.id;
                            });
                            if (floorIds.indexOf(floor.id) < 0) {
                                throw Errors.throw(Errors.CustomBadRequest, ['company was not inside floor']);
                            }
                        }

                        let door: IDB.LocationDoor = await new Parse.Query(IDB.LocationDoor)
                            .equalTo('name', value.name)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!!door) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate door name']);
                        }

                        door = new IDB.LocationDoor();

                        door.setValue('name', value.name);
                        door.setValue('floor', floor);
                        if ('companyId' in value) {
                            door.setValue('company', company);
                        } else {
                            door.setValue('range', value.range);
                        }

                        await door.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = door.id;
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
type InputR = IRequest.IDataList & IRequest.ILocation.IDoorIndexR;

type OutputR = IResponse.IDataList<IResponse.ILocation.IDoorIndexR> | IResponse.ILocation.IDoorIndexR;

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

            let query: Parse.Query<IDB.LocationDoor> = new Parse.Query(IDB.LocationDoor);

            if ('keyword' in _input) {
                let query1 = new Parse.Query(IDB.LocationDoor).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if ('floorId' in _input) {
                let floor: IDB.LocationFloors = await new Parse.Query(IDB.LocationFloors)
                    .equalTo('objectId', _input.floorId)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!floor) {
                    throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
                }

                query.equalTo('floor', floor);
            }
            if ('companyId' in _input) {
                let company: IDB.LocationCompanies = await new Parse.Query(IDB.LocationCompanies)
                    .equalTo('objectId', _input.companyId)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!company) {
                    throw Errors.throw(Errors.CustomBadRequest, ['company not found']);
                }

                query.equalTo('company', company);
            }

            if ('objectId' in _input) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let doors: IDB.LocationDoor[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include(['floor', 'company'])
                .find()
                .fail((e) => {
                    throw e;
                });

            let results = doors.map<IResponse.ILocation.IDoorIndexR>((value, index, array) => {
                let _floor: IResponse.IObject = !value.getValue('floor')
                    ? undefined
                    : {
                          objectId: value.getValue('floor').id,
                          name: value.getValue('floor').getValue('name'),
                      };

                let _comapny: IResponse.IObject = !value.getValue('company')
                    ? undefined
                    : {
                          objectId: value.getValue('company').id,
                          name: value.getValue('company').getValue('name'),
                      };

                let _range: string = !value.getValue('range') ? undefined : Enum.EDoorRange[value.getValue('range')];

                return {
                    objectId: value.id,
                    name: value.getValue('name'),
                    floor: _floor,
                    company: _comapny,
                    range: _range,
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
type InputU = IRequest.ILocation.IDoorIndexU[];

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
                        let door: IDB.LocationDoor = await new Parse.Query(IDB.LocationDoor)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!door) {
                            throw Errors.throw(Errors.CustomBadRequest, ['door not found']);
                        }

                        if ('name' in value) {
                            let _door: IDB.LocationDoor = await new Parse.Query(IDB.LocationDoor)
                                .notEqualTo('objectId', value.objectId)
                                .equalTo('name', value.name)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!!_door) {
                                throw Errors.throw(Errors.CustomBadRequest, ['duplicate door name']);
                            }

                            door.setValue('name', value.name);
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

                            door.setValue('floor', floor);
                        }
                        if ('companyId' in value) {
                            let company: IDB.LocationCompanies = await new Parse.Query(IDB.LocationCompanies)
                                .equalTo('objectId', value.companyId)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!company) {
                                throw Errors.throw(Errors.CustomBadRequest, ['company not found']);
                            }

                            let floorIds: string[] = company.getValue('floor').map((value1, index1, array1) => {
                                return value1.id;
                            });
                            if (floorIds.indexOf(door.getValue('floor').id) < 0) {
                                throw Errors.throw(Errors.CustomBadRequest, ['company was not inside floor']);
                            }

                            door.setValue('company', company);
                            door.unset('range');
                        }
                        if ('range' in value) {
                            door.setValue('range', value.range);
                            door.unset('company');
                        }

                        await door.save(null, { useMasterKey: true }).fail((e) => {
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
                        let door: IDB.LocationDoor = await new Parse.Query(IDB.LocationDoor)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!door) {
                            throw Errors.throw(Errors.CustomBadRequest, ['door not found']);
                        }

                        await door.destroy({ useMasterKey: true }).fail((e) => {
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
 * Delete when floor was delete
 */
IDB.LocationFloors.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let doors: IDB.LocationDoor[] = await new Parse.Query(IDB.LocationDoor)
                    .equalTo('floor', x.data)
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    doors.map(async (value, index, array) => {
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

/**
 * Delete when company was delete
 */
IDB.LocationCompanies.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let doors: IDB.LocationDoor[] = await new Parse.Query(IDB.LocationDoor)
                    .equalTo('company', x.data)
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    doors.map(async (value, index, array) => {
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

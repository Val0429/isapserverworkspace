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
type InputC = IRequest.ILocation.ICompaniesIndexC[];

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
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate company name']);
                        }

                        if (!value.contactPerson) {
                            throw Errors.throw(Errors.CustomBadRequest, ["contact person's name can not empty"]);
                        }

                        value.contactNumber.forEach((value1, index1, array1) => {
                            if (!(Regex.IsNum(value1) || Regex.IsInternationalPhone(value1))) {
                                throw Errors.throw(Errors.CustomBadRequest, ['contact number format error']);
                            }
                        });

                        if (!value.unitNumber) {
                            throw Errors.throw(Errors.CustomBadRequest, ['unit mumber can not empty']);
                        }

                        let floors: IDB.LocationFloors[] = await new Parse.Query(IDB.LocationFloors)
                            .containedIn('objectId', value.floorIds)
                            .find()
                            .fail((e) => {
                                throw e;
                            });
                        if (floors.length !== value.floorIds.length) {
                            throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
                        }

                        let comapny: IDB.LocationCompanies = await new Parse.Query(IDB.LocationCompanies)
                            .equalTo('name', value.name)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!!comapny) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate company name']);
                        }

                        comapny = new IDB.LocationCompanies();

                        comapny.setValue('floor', floors);
                        comapny.setValue('name', value.name);
                        comapny.setValue('contactPerson', value.contactPerson);
                        comapny.setValue('contactNumber', value.contactNumber);
                        comapny.setValue('unitNumber', value.unitNumber);

                        await comapny.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = comapny.id;
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
type InputR = IRequest.IDataList & IRequest.ILocation.ICompaniesIndexR;

type OutputR = IResponse.IDataList<IResponse.ILocation.ICompaniesIndexR> | IResponse.ILocation.ICompaniesIndexR;

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

            let query: Parse.Query<IDB.LocationCompanies> = new Parse.Query(IDB.LocationCompanies);

            if ('keyword' in _input) {
                let query1 = new Parse.Query(IDB.LocationCompanies).matches('name', new RegExp(_input.keyword), 'i');
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

                query.containedIn('floor', [floor]);
            }

            if ('objectId' in _input) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let companies: IDB.LocationCompanies[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include('floor')
                .find()
                .fail((e) => {
                    throw e;
                });

            let results = companies.map<IResponse.ILocation.ICompaniesIndexR>((value, index, array) => {
                let _floors: IResponse.IObject[] = value.getValue('floor').map((value1, index1, array1) => {
                    return {
                        objectId: value1.id,
                        name: value1.getValue('name'),
                    };
                });

                return {
                    objectId: value.id,
                    name: value.getValue('name'),
                    floors: _floors,
                    contactPerson: value.getValue('contactPerson'),
                    contactNumber: value.getValue('contactNumber'),
                    unitNumber: value.getValue('unitNumber'),
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
type InputU = IRequest.ILocation.ICompaniesIndexU[];

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
                        let company: IDB.LocationCompanies = await new Parse.Query(IDB.LocationCompanies)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!company) {
                            throw Errors.throw(Errors.CustomBadRequest, ['company not found']);
                        }

                        if ('name' in value) {
                            let _company: IDB.LocationCompanies = await new Parse.Query(IDB.LocationCompanies)
                                .notEqualTo('objectId', value.objectId)
                                .equalTo('name', value.name)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!!_company) {
                                throw Errors.throw(Errors.CustomBadRequest, ['duplicate company name']);
                            }

                            company.setValue('name', value.name);
                        }
                        if ('floorIds' in value) {
                            let floors: IDB.LocationFloors[] = await new Parse.Query(IDB.LocationFloors)
                                .containedIn('objectId', value.floorIds)
                                .find()
                                .fail((e) => {
                                    throw e;
                                });
                            if (floors.length !== value.floorIds.length) {
                                throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
                            }

                            company.setValue('floor', floors);
                        }
                        if ('contactPerson' in value) {
                            if (!value.contactPerson) {
                                throw Errors.throw(Errors.CustomBadRequest, ["contact person's name can not empty"]);
                            }

                            company.setValue('contactPerson', value.contactPerson);
                        }
                        if ('contactNumber' in value) {
                            value.contactNumber.forEach((value1, index1, array1) => {
                                if (!(Regex.IsNum(value1) || Regex.IsInternationalPhone(value1))) {
                                    throw Errors.throw(Errors.CustomBadRequest, ['contact number format error']);
                                }
                            });

                            company.setValue('contactNumber', value.contactNumber);
                        }
                        if ('unitNumber' in value) {
                            if (!value.unitNumber) {
                                throw Errors.throw(Errors.CustomBadRequest, ['unit mumber can not empty']);
                            }

                            company.setValue('unitNumber', value.unitNumber);
                        }

                        await company.save(null, { useMasterKey: true }).fail((e) => {
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
                        let company: IDB.LocationCompanies = await new Parse.Query(IDB.LocationCompanies)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!company) {
                            throw Errors.throw(Errors.CustomBadRequest, ['company not found']);
                        }

                        await company.destroy({ useMasterKey: true }).fail((e) => {
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
 * Unbinding when floor was delete
 */
IDB.LocationFloors.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let companies: IDB.LocationCompanies[] = await new Parse.Query(IDB.LocationCompanies)
                    .containedIn('floor', [x.data])
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    companies.map(async (value, index, array) => {
                        let floors: IDB.LocationFloors[] = value.getValue('floor').filter((value1, index1, array1) => {
                            return value1.id !== x.data.id;
                        });
                        if (floors.length === 0) {
                            await value.destroy({ useMasterKey: true }).fail((e) => {
                                throw e;
                            });
                        } else {
                            value.setValue('floor', floors);

                            await value.save(null, { useMasterKey: true }).fail((e) => {
                                throw e;
                            });
                        }
                    }),
                );
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });

import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, Parser, Db } from '../../custom/helpers';
import * as Middleware from '../../custom/middlewares';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Create
 */
type InputC = IRequest.IOfficeHour.IIndexC[];

type OutputC = IResponse.IMultiData[];

action.post(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: OutputC = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let officeHour: IDB.OfficeHour = await new Parse.Query(IDB.OfficeHour)
                            .equalTo('name', value.name)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (officeHour) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate name']);
                        }

                        let dayRanges: IDB.IDayRange[] = value.dayRanges.map((value, index, array) => {
                            return {
                                startDay: value.startDay,
                                endDay: value.endDay,
                                startDate: new Date(new Date(value.startDate).setFullYear(2000, 0, 1)),
                                endDate: new Date(new Date(value.endDate).setFullYear(2000, 0, 1)),
                            };
                        });

                        officeHour = new IDB.OfficeHour();

                        officeHour.setValue('name', value.name);
                        officeHour.setValue('dayRanges', dayRanges);
                        officeHour.setValue('sites', []);

                        await officeHour.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = officeHour.id;
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

type OutputR = IResponse.IDataList<IResponse.IOfficeHour.IIndexR>;

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

            let query: Parse.Query<IDB.OfficeHour> = new Parse.Query(IDB.OfficeHour);

            if (_input.keyword) {
                let query1 = new Parse.Query(IDB.OfficeHour).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let officeHours: IDB.OfficeHour[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include('sites')
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
                results: officeHours.map((value, index, array) => {
                    let sites: IResponse.IObject[] = value.getValue('sites').map((value1, index1, array1) => {
                        return {
                            objectId: value1.id,
                            name: value1.getValue('name'),
                        };
                    });

                    return {
                        objectId: value.id,
                        name: value.getValue('name'),
                        dayRanges: value.getValue('dayRanges'),
                        sites: sites,
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
type InputU = IRequest.IOfficeHour.IIndexU[];

type OutputU = IResponse.IMultiData[];

action.put(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: OutputU = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let officeHour = await new Parse.Query(IDB.OfficeHour)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!officeHour) {
                            throw Errors.throw(Errors.CustomNotExists, ['office hour not found']);
                        }

                        if (value.dayRanges) {
                            let dayRanges: IDB.IDayRange[] = value.dayRanges.map((value, index, array) => {
                                return {
                                    startDay: value.startDay,
                                    endDay: value.endDay,
                                    startDate: new Date(new Date(value.startDate).setFullYear(2000, 0, 1)),
                                    endDate: new Date(new Date(value.endDate).setFullYear(2000, 0, 1)),
                                };
                            });

                            officeHour.setValue('dayRanges', dayRanges);
                        }

                        await officeHour.save(null, { useMasterKey: true }).fail((e) => {
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
                        let officeHour = await new Parse.Query(IDB.OfficeHour)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!officeHour) {
                            throw Errors.throw(Errors.CustomNotExists, ['office hour not found']);
                        }

                        await officeHour.destroy({ useMasterKey: true }).fail((e) => {
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
 * Unbinding when site was delete
 */
IDB.LocationSite.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let officeHours: IDB.OfficeHour[] = await new Parse.Query(IDB.OfficeHour)
                    .containedIn('sites', [x.data])
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    officeHours.map(async (value, index, array) => {
                        let sites: IDB.LocationSite[] = value.getValue('sites').filter((value1, index1, array1) => {
                            return value1.id !== x.data.id;
                        });
                        value.setValue('sites', sites);

                        await value.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    }),
                );
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });

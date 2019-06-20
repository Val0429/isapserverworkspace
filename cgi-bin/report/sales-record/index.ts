import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Parser, Db } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Create
 */
type InputC = IRequest.IReport.ISalesRecordC[];

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
                        let date: Date = new Date(new Date(value.date).setMinutes(0, 0, 0));

                        let site: IDB.LocationSite = await new Parse.Query(IDB.LocationSite)
                            .equalTo('customId', value.customId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!site) {
                            throw Errors.throw(Errors.CustomBadRequest, ['site not found']);
                        }

                        let record: IDB.ReportSalesRecord = await new Parse.Query(IDB.ReportSalesRecord)
                            .equalTo('site', site)
                            .equalTo('date', date)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!record) {
                            record = new IDB.ReportSalesRecord();

                            record.setValue('site', site);
                            record.setValue('date', date);
                        }

                        record.setValue('revenue', value.revenue);
                        record.setValue('transaction', value.transaction);

                        await record.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = record.id;
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
type InputR = IRequest.IDataList & IRequest.IReport.ISalesRecordR;

type OutputR = IResponse.IDataList<IResponse.IReport.ISalesRecordR>;

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

            let query: Parse.Query<IDB.ReportSalesRecord> = new Parse.Query(IDB.ReportSalesRecord);

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }
            if (_input.date) {
                query.equalTo('date', _input.date);
            }
            if (_input.siteId) {
                let site: IDB.LocationSite = new IDB.LocationSite();
                site.id = _input.siteId;

                query.equalTo('site', site);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let records: IDB.ReportSalesRecord[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include('site')
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
                results: records.map((value, index, array) => {
                    let site: IResponse.IObject = {
                        objectId: value.getValue('site').id,
                        name: value.getValue('site').getValue('name'),
                    };

                    return {
                        objectId: value.id,
                        site: site,
                        date: value.getValue('date'),
                        revenue: value.getValue('revenue'),
                        transaction: value.getValue('transaction'),
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
type InputU = IRequest.IReport.ISalesRecordU[];

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
                        let record: IDB.ReportSalesRecord = await new Parse.Query(IDB.ReportSalesRecord)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!record) {
                            throw Errors.throw(Errors.CustomBadRequest, ['sales record not found']);
                        }

                        if (value.revenue || value.revenue === 0) {
                            record.setValue('revenue', value.revenue);
                        }
                        if (value.transaction || value.transaction === 0) {
                            record.setValue('transaction', value.transaction);
                        }

                        await record.save(null, { useMasterKey: true }).fail((e) => {
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
                        let record: IDB.ReportSalesRecord = await new Parse.Query(IDB.ReportSalesRecord)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!record) {
                            throw Errors.throw(Errors.CustomBadRequest, ['sales record not found']);
                        }

                        await record.destroy({ useMasterKey: true }).fail((e) => {
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

import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Parser, Db } from '../../../custom/helpers';
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
type InputC = IRequest.IEvent.ICampaignIndexC[];

type OutputC = IResponse.IMultiData[];

action.post(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: OutputC = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
                            .containedIn('objectId', value.siteIds)
                            .find()
                            .fail((e) => {
                                throw e;
                            });

                        let campaign: IDB.EventCampaign = new IDB.EventCampaign();

                        campaign.setValue('name', value.name);
                        campaign.setValue('type', value.type);
                        campaign.setValue('year', value.year);
                        campaign.setValue('budget', value.budget);
                        campaign.setValue('description', value.description);
                        campaign.setValue('sites', sites);
                        campaign.setValue('startDate', value.startDate);
                        campaign.setValue('endDate', value.endDate);

                        await campaign.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = campaign.id;
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

type OutputR = IResponse.IDataList<IResponse.IEvent.ICampaignIndexR>;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
        permission: [RoleList.SuperAdministrator, RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            let query: Parse.Query<IDB.EventCampaign> = new Parse.Query(IDB.EventCampaign);

            if (_input.keyword) {
                let query1 = new Parse.Query(IDB.EventCampaign).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let campaigns: IDB.EventCampaign[] = await query
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
                results: campaigns.map((value, index, array) => {
                    let sites: IResponse.IObject[] = value.getValue('sites').map((value1, index1, array1) => {
                        return {
                            objectId: value1.id,
                            name: value1.getValue('name'),
                        };
                    });

                    return {
                        objectId: value.id,
                        name: value.getValue('name'),
                        type: value.getValue('type'),
                        year: value.getValue('year'),
                        budget: value.getValue('budget'),
                        description: value.getValue('description'),
                        sites: sites,
                        startDate: value.getValue('startDate'),
                        endDate: value.getValue('endDate'),
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
type InputU = IRequest.IEvent.ICampaignIndexU[];

type OutputU = IResponse.IMultiData[];

action.put(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: OutputU = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let campaign = await new Parse.Query(IDB.EventCampaign)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!campaign) {
                            throw Errors.throw(Errors.CustomNotExists, ['campaign not found']);
                        }

                        if (value.type || value.type === '') {
                            campaign.setValue('type', value.type);
                        }
                        if (value.year || value.year === 0) {
                            campaign.setValue('year', value.year);
                        }
                        if (value.budget || value.budget === 0) {
                            campaign.setValue('budget', value.budget);
                        }
                        if (value.description || value.description === '') {
                            campaign.setValue('description', value.description);
                        }
                        if (value.siteIds) {
                            let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
                                .containedIn('objectId', value.siteIds)
                                .find()
                                .fail((e) => {
                                    throw e;
                                });

                            campaign.setValue('sites', sites);
                        }
                        if (value.startDate) {
                            campaign.setValue('startDate', value.startDate);
                        }
                        if (value.endDate) {
                            campaign.setValue('endDate', value.endDate);
                        }

                        await campaign.save(null, { useMasterKey: true }).fail((e) => {
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
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
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
                        let campaign = await new Parse.Query(IDB.EventCampaign)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!campaign) {
                            throw Errors.throw(Errors.CustomNotExists, ['campaign not found']);
                        }

                        await campaign.destroy({ useMasterKey: true }).fail((e) => {
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
                let campaigns: IDB.EventCampaign[] = await new Parse.Query(IDB.EventCampaign)
                    .containedIn('sites', [x.data])
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    campaigns.map(async (value, index, array) => {
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

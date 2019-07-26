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
type InputC = (IRequest.IReport.ITemplateC_Type | IRequest.IReport.ITemplateC_Date)[];

type OutputC = IResponse.IMultiData[];

action.post(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: OutputC = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let siteIds: string[] = value.siteIds.filter((value1, index1, array1) => {
                            return _userInfo.siteIds.indexOf(value1) > -1;
                        });
                        let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
                            .containedIn('objectId', siteIds)
                            .find()
                            .fail((e) => {
                                throw e;
                            });

                        let tags: IDB.Tag[] = await new Parse.Query(IDB.Tag)
                            .containedIn('objectId', value.tagIds)
                            .find()
                            .fail((e) => {
                                throw e;
                            });

                        let sendUsers: Parse.User[] = await new Parse.Query(Parse.User)
                            .containedIn('objectId', value.sendUserIds)
                            .find()
                            .fail((e) => {
                                throw e;
                            });

                        let template: IDB.ReportTemplate = new IDB.ReportTemplate();

                        template.setValue('user', data.user);
                        template.setValue('name', value.name);
                        template.setValue('mode', value.mode);
                        template.setValue('sites', sites);
                        template.setValue('tags', tags);
                        template.setValue('sendDates', value.sendDates);
                        template.setValue('sendUsers', sendUsers);

                        if ('type' in value) {
                            template.setValue('type', value.type);
                        } else {
                            template.setValue('startDate', value.startDate);
                            template.setValue('endDate', value.endDate);
                        }

                        await template.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = template.id;
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

type OutputR = IResponse.IDataList<IResponse.IReport.ITemplateR>;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            let query: Parse.Query<IDB.ReportTemplate> = new Parse.Query(IDB.ReportTemplate);

            if (_input.keyword) {
                let query1 = new Parse.Query(IDB.ReportTemplate).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            query.equalTo('user', data.user);

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let template: IDB.ReportTemplate[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include(['sites', 'tags'])
                .find()
                .fail((e) => {
                    throw e;
                });

            let sendUsers: Parse.User[] = [].concat(
                ...template.map((value, index, array) => {
                    return value.getValue('sendUsers');
                }),
            );

            let sendUserInfos: IDB.UserInfo[] = await new Parse.Query(IDB.UserInfo)
                .containedIn('user', sendUsers)
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
                results: template.map((value, index, array) => {
                    let sites: IResponse.IObject[] = (value.getValue('sites') || []).map((value1, index1, array1) => {
                        return {
                            objectId: value1.id,
                            name: value1.getValue('name'),
                        };
                    });

                    let tags: IResponse.IObject[] = (value.getValue('tags') || []).map((value1, index1, array1) => {
                        return {
                            objectId: value1.id,
                            name: value1.getValue('name'),
                        };
                    });

                    let sendUsers: IResponse.IReport.ISendUser[] = sendUserInfos
                        .filter((value1, index1, array1) => {
                            return !!value.getValue('sendUsers').find((value2, index2, array2) => {
                                return value2.id === value1.getValue('user').id;
                            });
                        })
                        .map((value1, index1, array1) => {
                            return {
                                objectId: value1.getValue('user').id,
                                name: value1.getValue('name'),
                                email: value1.getValue('email'),
                            };
                        });

                    let type: string = value.getValue('type') ? Enum.EDatePeriodType[value.getValue('type')] : undefined;

                    let startDate: Date = value.getValue('startDate') ? value.getValue('startDate') : undefined;
                    let endDate: Date = value.getValue('endDate') ? value.getValue('endDate') : undefined;

                    return {
                        objectId: value.id,
                        name: value.getValue('name'),
                        mode: Enum.EDeviceMode[value.getValue('mode')],
                        type: type,
                        sites: sites,
                        tags: tags,
                        startDate: startDate,
                        endDate: endDate,
                        sendDates: value.getValue('sendDates'),
                        sendUsers: sendUsers,
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
type InputU = IRequest.IReport.ITemplateU[];

type OutputU = IResponse.IMultiData[];

action.put(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: OutputU = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let template: IDB.ReportTemplate = await new Parse.Query(IDB.ReportTemplate)
                            .equalTo('user', data.user)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!template) {
                            throw Errors.throw(Errors.CustomBadRequest, ['template not found']);
                        }

                        if (value.name || value.name === '') {
                            template.setValue('name', value.name);
                        }
                        if (value.mode) {
                            template.setValue('mode', value.mode);
                        }
                        if (value.type) {
                            template.setValue('type', value.type);
                        }
                        if (value.siteIds) {
                            let siteIds: string[] = value.siteIds.filter((value1, index1, array1) => {
                                return _userInfo.siteIds.indexOf(value1) > -1;
                            });
                            let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
                                .containedIn('objectId', siteIds)
                                .find()
                                .fail((e) => {
                                    throw e;
                                });

                            template.setValue('sites', sites);
                        }
                        if (value.tagIds) {
                            let tags: IDB.Tag[] = await new Parse.Query(IDB.Tag)
                                .containedIn('objectId', value.tagIds)
                                .find()
                                .fail((e) => {
                                    throw e;
                                });

                            template.setValue('tags', tags);
                        }
                        if (value.startDate) {
                            template.setValue('startDate', value.startDate);
                        }
                        if (value.endDate) {
                            template.setValue('endDate', value.endDate);
                        }
                        if (value.sendDates) {
                            template.setValue('sendDates', value.sendDates);
                        }
                        if (value.sendUserIds) {
                            let sendUsers: Parse.User[] = await new Parse.Query(Parse.User)
                                .containedIn('objectId', value.sendUserIds)
                                .find()
                                .fail((e) => {
                                    throw e;
                                });

                            template.setValue('sendUsers', sendUsers);
                        }

                        await template.save(null, { useMasterKey: true }).fail((e) => {
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
        permission: [RoleList.Admin, RoleList.User],
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
                        let template: IDB.ReportTemplate = await new Parse.Query(IDB.ReportTemplate)
                            .equalTo('user', data.user)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!template) {
                            throw Errors.throw(Errors.CustomBadRequest, ['template not found']);
                        }

                        await template.destroy({ useMasterKey: true }).fail((e) => {
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
                let template: IDB.ReportTemplate[] = await new Parse.Query(IDB.ReportTemplate)
                    .containedIn('sites', [x.data])
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    template.map(async (value, index, array) => {
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

/**
 * Unbinding when tag was delete
 */
IDB.Tag.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let template: IDB.ReportTemplate[] = await new Parse.Query(IDB.ReportTemplate)
                    .containedIn('tags', [x.data])
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    template.map(async (value, index, array) => {
                        let tags: IDB.Tag[] = value.getValue('tags').filter((value1, index1, array1) => {
                            return value1.id !== x.data.id;
                        });
                        value.setValue('tags', tags);

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

/**
 * Unbinding when send user was delete
 */
IDB.UserInfo.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let template: IDB.ReportTemplate[] = await new Parse.Query(IDB.ReportTemplate)
                    .containedIn('sendUsers', [x.data.get('user')])
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    template.map(async (value, index, array) => {
                        let sendUsers: Parse.User[] = value.getValue('sendUsers').filter((value1, index1, array1) => {
                            return value1.id !== x.data.get('user').id;
                        });
                        value.setValue('sendUsers', sendUsers);

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

/**
 * delete when user was delete
 */
IDB.UserInfo.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let template: IDB.ReportTemplate[] = await new Parse.Query(IDB.ReportTemplate)
                    .containedIn('user', [x.data.get('user')])
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    template.map(async (value, index, array) => {
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

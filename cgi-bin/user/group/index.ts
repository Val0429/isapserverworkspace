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
type InputC = IRequest.IUser.IGroupIndexC[];

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
                        let group: IDB.UserGroup = new IDB.UserGroup();

                        let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
                            .containedIn('objectId', value.siteIds)
                            .find()
                            .fail((e) => {
                                throw e;
                            });

                        group.setValue('name', value.name);
                        group.setValue('description', value.description);
                        group.setValue('sites', sites);

                        group.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = group.id;
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

type OutputR = IResponse.IDataList<IResponse.IUser.IGroupIndexR>;

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

            let query: Parse.Query<IDB.UserGroup> = new Parse.Query(IDB.UserGroup);

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let groups: IDB.UserGroup[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include('sites')
                .find()
                .fail((e) => {
                    throw e;
                });

            let userInfos: IDB.UserInfo[] = await new Parse.Query(IDB.UserInfo)
                .notEqualTo('groups', [])
                .notEqualTo('groups', null)
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
                results: groups.map((value, index, array) => {
                    let sites: IResponse.IObject[] = value.getValue('sites').map((value1, index1, array1) => {
                        return {
                            objectId: value1.id,
                            name: value1.getValue('name'),
                        };
                    });

                    let users: IResponse.IObject[] = userInfos
                        .filter((value1, index1, array1) => {
                            let groupIs: string[] = value1.getValue('groups').map((value2, index2, array2) => {
                                return value2.id;
                            });
                            return groupIs.indexOf(value.id) > -1;
                        })
                        .map((value1, index1, array1) => {
                            return {
                                objectId: value1.id,
                                name: value1.getValue('name'),
                            };
                        });

                    return {
                        objectId: value.id,
                        name: value.getValue('name'),
                        description: value.getValue('description'),
                        sites: sites,
                        users: users,
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
type InputU = IRequest.IUser.IGroupIndexU[];

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
                        let group: IDB.UserGroup = await new Parse.Query(IDB.UserGroup)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!group) {
                            throw Errors.throw(Errors.CustomBadRequest, ['user group not found']);
                        }

                        if (value.description || value.description === '') {
                            group.setValue('description', value.description);
                        }
                        if (value.siteIds) {
                            let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
                                .containedIn('objectId', value.siteIds)
                                .find()
                                .fail((e) => {
                                    throw e;
                                });

                            group.setValue('sites', sites);
                        }

                        group.save(null, { useMasterKey: true }).fail((e) => {
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
                        let group: IDB.UserGroup = await new Parse.Query(IDB.UserGroup)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!group) {
                            throw Errors.throw(Errors.CustomBadRequest, ['user group not found']);
                        }

                        let userInfos: IDB.UserInfo[] = await new Parse.Query(IDB.UserInfo)
                            .containedIn('groups', [group])
                            .find()
                            .fail((e) => {
                                throw e;
                            });

                        await group.destroy({ useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        await Promise.all(
                            userInfos.map(async (value1, index1, array1) => {
                                let groups: IDB.UserGroup[] = value1.getValue('groups').filter((value2, index2, array2) => {
                                    return value2.id !== value;
                                });
                                value1.setValue('groups', groups);

                                await value1.save(null, { useMasterKey: true }).fail((e) => {
                                    throw e;
                                });
                            }),
                        );
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

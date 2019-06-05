import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Parser, Db } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import * as Device from '../';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Create
 */
type InputC = IRequest.IDevice.IGroupIndexC[];

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
                        let area: IDB.LocationArea = await new Parse.Query(IDB.LocationArea)
                            .equalTo('objectId', value.areaId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!area) {
                            throw Errors.throw(Errors.CustomBadRequest, ['area not found']);
                        }

                        let group: IDB.DeviceGroup = await new Parse.Query(IDB.DeviceGroup)
                            .equalTo('area', area)
                            .equalTo('name', value.name)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (group) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate name']);
                        }

                        group = new IDB.DeviceGroup();

                        group.setValue('site', area.getValue('site'));
                        group.setValue('area', area);
                        group.setValue('name', value.name);

                        await group.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = group.id;
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.DeviceGroup$.next({ crud: 'c' });

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
type InputR = IRequest.IDataList & IRequest.IDevice.IGroupAll;

type OutputR = IResponse.IDataList<IResponse.IDevice.IGroupIndexR>;

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

            let query: Parse.Query<IDB.DeviceGroup> = new Parse.Query(IDB.DeviceGroup);

            if (_input.keyword) {
                let query1 = new Parse.Query(IDB.DeviceGroup).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }
            if (_input.siteId) {
                let site: IDB.LocationSite = new IDB.LocationSite();
                site.id = _input.siteId;

                query.equalTo('site', site);
            }
            if (_input.areaId) {
                let area: IDB.LocationArea = new IDB.LocationArea();
                area.id = _input.areaId;

                query.equalTo('area', area);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let groups: IDB.DeviceGroup[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include(['site', 'area'])
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
                    let site: IResponse.IObject = {
                        objectId: value.getValue('site').id,
                        name: value.getValue('site').getValue('name'),
                    };

                    let area: IResponse.IObject = {
                        objectId: value.getValue('area').id,
                        name: value.getValue('area').getValue('name'),
                    };

                    return {
                        objectId: value.id,
                        site: site,
                        area: area,
                        name: value.getValue('name'),
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
type InputU = IRequest.IDevice.IGroupIndexU[];

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
                        let group: IDB.DeviceGroup = await new Parse.Query(IDB.DeviceGroup)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!group) {
                            throw Errors.throw(Errors.CustomBadRequest, ['group not found']);
                        }

                        await group.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.DeviceGroup$.next({ crud: 'u' });

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
                        let group: IDB.DeviceGroup = await new Parse.Query(IDB.DeviceGroup)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!group) {
                            throw Errors.throw(Errors.CustomBadRequest, ['group not found']);
                        }

                        await Delete(group);
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.DeviceGroup$.next({ crud: 'd' });

            return resMessages;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Delete group
 * @param objectId
 */
export async function Delete(group: IDB.DeviceGroup): Promise<void> {
    try {
        await Device.UnbindingGroup(group);

        await group.destroy({ useMasterKey: true }).fail((e) => {
            throw e;
        });
    } catch (e) {
        throw e;
    }
}

/**
 * Delete group
 * @param area
 */
export async function Deletes(area: IDB.LocationArea): Promise<void> {
    try {
        let groups: IDB.DeviceGroup[] = await new Parse.Query(IDB.DeviceGroup)
            .equalTo('area', area)
            .find()
            .fail((e) => {
                throw e;
            });

        await Promise.all(
            groups.map(async (value, index, array) => {
                await Delete(value);
            }),
        );
    } catch (e) {
        throw e;
    }
}

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
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IDevice.IIndexR;

type OutputR = IResponse.IDataList<IResponse.IDevice.IIndexR>;

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

            let query: Parse.Query<IDB.Device> = new Parse.Query(IDB.Device);

            if (_input.keyword) {
                let query1 = new Parse.Query(IDB.Device).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }
            if (_input.mode) {
                query.equalTo('mode', _input.mode);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let devices: IDB.Device[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include(['site', 'area', 'group', 'config.server'])
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
                results: devices.map((value, index, array) => {
                    let site: IResponse.IObject = value.getValue('group')
                        ? {
                              objectId: value.getValue('site').id,
                              name: value.getValue('site').getValue('name'),
                          }
                        : undefined;

                    let area: IResponse.IObject = value.getValue('group')
                        ? {
                              objectId: value.getValue('area').id,
                              name: value.getValue('area').getValue('name'),
                          }
                        : undefined;

                    let group: IResponse.IObject = value.getValue('group')
                        ? {
                              objectId: value.getValue('group').id,
                              name: value.getValue('group').getValue('name'),
                          }
                        : undefined;

                    let config: IResponse.IDevice.ICameraCMS | IResponse.IDevice.ICameraFRS | IDB.ICameraHanwha = undefined;
                    let model: string = undefined;
                    switch (value.getValue('brand')) {
                        case Enum.EDeviceBrand.isap:
                            model = Enum.EDeviceModelIsap[value.getValue('model')];
                            switch (value.getValue('model')) {
                                case Enum.EDeviceModelIsap.cms:
                                    let cmsConfig: IDB.ICameraCMS = value.getValue('config') as IDB.ICameraCMS;
                                    config = {
                                        server: {
                                            objectId: cmsConfig.server.id,
                                            name: cmsConfig.server.getValue('name'),
                                        },
                                        nvrId: cmsConfig.nvrId,
                                        channelId: cmsConfig.channelId,
                                    };
                                    break;
                                case Enum.EDeviceModelIsap.frs:
                                    let frsConfig: IDB.ICameraFRS = value.getValue('config') as IDB.ICameraFRS;
                                    config = {
                                        server: {
                                            objectId: frsConfig.server.id,
                                            name: frsConfig.server.getValue('name'),
                                        },
                                        sourceid: frsConfig.sourceid,
                                        location: frsConfig.location,
                                    };
                                    break;
                            }
                            break;
                        case Enum.EDeviceBrand.hanwha:
                            model = Enum.EDeviceModelHanwha[value.getValue('model')];
                            config = value.getValue('config') as IDB.ICameraHanwha;
                            break;
                    }

                    return {
                        objectId: value.id,
                        customId: value.getValue('customId'),
                        site: site,
                        area: area,
                        group: group,
                        name: value.getValue('name'),
                        brand: Enum.EDeviceBrand[value.getValue('brand')],
                        model: model,
                        mode: Enum.EDeviceMode[value.getValue('mode')],
                        config: config,
                        direction: value.getValue('direction') ? Enum.EDeviceDirection[value.getValue('direction')] : undefined,
                        rois: value.getValue('rois'),
                        x: value.getValue('x'),
                        y: value.getValue('y'),
                        angle: value.getValue('angle'),
                        visibleDistance: value.getValue('visibleDistance'),
                        visibleAngle: value.getValue('visibleAngle'),
                        dataWindowX: value.getValue('dataWindowX'),
                        dataWindowY: value.getValue('dataWindowY'),
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
                        let device: IDB.Device = await new Parse.Query(IDB.Device)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!device) {
                            throw Errors.throw(Errors.CustomBadRequest, ['device not found']);
                        }

                        await device.destroy({ useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.Device$.next({ crud: 'd' });

            return resMessages;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Unbinding device area
 * @param area
 */
export async function UnbindingArea(area: IDB.LocationArea): Promise<void> {
    try {
        let devices: IDB.Device[] = await new Parse.Query(IDB.Device)
            .equalTo('area', area)
            .find()
            .fail((e) => {
                throw e;
            });

        await Promise.all(
            devices.map(async (value, index, array) => {
                value.unset('area');

                await value.save(null, { useMasterKey: true }).fail((e) => {
                    throw e;
                });
            }),
        );
    } catch (e) {
        throw e;
    }
}

/**
 * Unbinding device group
 * @param group
 */
export async function UnbindingGroup(group: IDB.DeviceGroup): Promise<void> {
    try {
        let devices: IDB.Device[] = await new Parse.Query(IDB.Device)
            .equalTo('group', group)
            .find()
            .fail((e) => {
                throw e;
            });

        await Promise.all(
            devices.map(async (value, index, array) => {
                value.unset('group');

                await value.save(null, { useMasterKey: true }).fail((e) => {
                    throw e;
                });
            }),
        );
    } catch (e) {
        throw e;
    }
}

/**
 * Delete device by server
 * @param serverId
 */
export async function DeleteByServer(serverId: string): Promise<void> {
    try {
        let devices: IDB.Device[] = await new Parse.Query(IDB.Device)
            .equalTo('config.server.objectId', serverId)
            .find()
            .fail((e) => {
                throw e;
            });

        await Promise.all(
            devices.map(async (value, index, array) => {
                await value.destroy({ useMasterKey: true }).fail((e) => {
                    throw e;
                });
            }),
        );
    } catch (e) {
        throw e;
    }
}

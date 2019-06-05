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
type InputC = IRequest.IDevice.IDemographicC[];

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
                        let site: IDB.LocationSite = undefined;
                        let area: IDB.LocationArea = undefined;
                        if (value.areaId) {
                            area = await new Parse.Query(IDB.LocationArea)
                                .equalTo('objectId', value.areaId)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!area) {
                                throw Errors.throw(Errors.CustomBadRequest, ['area not found']);
                            }

                            site = area.getValue('site');
                        }

                        let group: IDB.DeviceGroup = undefined;
                        if (value.groupId) {
                            group = await new Parse.Query(IDB.DeviceGroup)
                                .equalTo('objectId', value.groupId)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!group) {
                                throw Errors.throw(Errors.CustomBadRequest, ['group not found']);
                            }
                        }

                        let device: IDB.Device = await new Parse.Query(IDB.Device)
                            .equalTo('customId', value.customId)
                            .equalTo('mode', Enum.EDeviceMode.demographic)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (device) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate custom id']);
                        }

                        let server: IDB.ServerFRS = await new Parse.Query(IDB.ServerFRS)
                            .equalTo('objectId', value.config.serverId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
                        }

                        let config: IDB.ICameraFRS = {
                            server: server,
                            sourceid: value.config.sourceid,
                            location: value.config.location,
                        };

                        device = new IDB.Device();

                        device.setValue('customId', value.customId);
                        device.setValue('site', site);
                        device.setValue('area', area);
                        device.setValue('group', group);
                        device.setValue('name', value.name);
                        device.setValue('brand', Enum.EDeviceBrand.isap);
                        device.setValue('model', Enum.EDeviceModelIsap.frs);
                        device.setValue('mode', Enum.EDeviceMode.demographic);
                        device.setValue('config', config);
                        device.setValue('x', 0);
                        device.setValue('y', 0);
                        device.setValue('angle', 0);
                        device.setValue('visibleDistance', 0);
                        device.setValue('visibleAngle', 0);
                        device.setValue('dataWindowX', 0);
                        device.setValue('dataWindowY', 0);

                        await device.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = device.id;
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.Device$.next({ crud: 'c' });

            return resMessages;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.IDevice.IDemographicU[];

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
                        let device: IDB.Device = await new Parse.Query(IDB.Device)
                            .equalTo('objectId', value.objectId)
                            .equalTo('mode', Enum.EDeviceMode.demographic)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!device) {
                            throw Errors.throw(Errors.CustomBadRequest, ['device not found']);
                        }

                        if (value.areaId) {
                            let area: IDB.LocationArea = await new Parse.Query(IDB.LocationArea)
                                .equalTo('objectId', value.areaId)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!area) {
                                throw Errors.throw(Errors.CustomBadRequest, ['area not found']);
                            }

                            let site: IDB.LocationSite = area.getValue('site');

                            device.setValue('area', area);
                            device.setValue('site', site);
                        }
                        if (value.groupId) {
                            let group: IDB.DeviceGroup = await new Parse.Query(IDB.DeviceGroup)
                                .equalTo('objectId', value.groupId)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!group) {
                                throw Errors.throw(Errors.CustomBadRequest, ['group not found']);
                            }

                            device.setValue('group', group);
                        }
                        if (value.name || value.name === '') {
                            device.setValue('name', value.name);
                        }
                        if (value.x || value.x === 0) {
                            device.setValue('x', value.x);
                        }
                        if (value.y || value.y === 0) {
                            device.setValue('y', value.y);
                        }
                        if (value.angle || value.angle === 0) {
                            device.setValue('angle', value.angle);
                        }
                        if (value.visibleDistance || value.visibleDistance === 0) {
                            device.setValue('visibleDistance', value.visibleDistance);
                        }
                        if (value.visibleAngle || value.visibleAngle === 0) {
                            device.setValue('visibleAngle', value.visibleAngle);
                        }
                        if (value.dataWindowX || value.dataWindowX === 0) {
                            device.setValue('dataWindowX', value.dataWindowX);
                        }
                        if (value.dataWindowY || value.dataWindowY === 0) {
                            device.setValue('dataWindowY', value.dataWindowY);
                        }
                        if (value.config) {
                            let server: IDB.ServerFRS = await new Parse.Query(IDB.ServerFRS)
                                .equalTo('objectId', value.config.serverId)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!server) {
                                throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
                            }

                            let config: IDB.ICameraFRS = {
                                server: server,
                                sourceid: value.config.sourceid,
                                location: value.config.location,
                            };

                            device.setValue('config', config);
                        }

                        await device.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.Device$.next({ crud: 'u' });

            return resMessages;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

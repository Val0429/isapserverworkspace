import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, Db, PeopleCounting, Utility } from '../../custom/helpers';
import * as Middleware from '../../custom/middlewares';
import * as Enum from '../../custom/enums';
import licenseService from 'services/license';

let action = new Action({
    loginRequired: true,
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
        permission: [RoleList.SuperAdministrator, RoleList.Admin, RoleList.User],
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
            if (_input.groupId) {
                let group: IDB.DeviceGroup = new IDB.DeviceGroup();
                group.id = _input.groupId;

                query.containedIn('groups', [group]);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let devices: IDB.Device[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include(['site', 'area', 'groups', 'config.server', 'demoServer', 'hdServer'])
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
                    let site: IResponse.IObject = value.getValue('site')
                        ? {
                              objectId: value.getValue('site').id,
                              name: value.getValue('site').getValue('name'),
                          }
                        : undefined;

                    let area: IResponse.IObject = value.getValue('area')
                        ? {
                              objectId: value.getValue('area').id,
                              name: value.getValue('area').getValue('name'),
                          }
                        : undefined;

                    let demoServer: IResponse.IObject = value.getValue('demoServer')
                        ? {
                              objectId: value.getValue('demoServer').id,
                              name: value.getValue('demoServer').getValue('name'),
                          }
                        : undefined;

                    let hdServer: IResponse.IObject = value.getValue('hdServer')
                        ? {
                              objectId: value.getValue('hdServer').id,
                              name: value.getValue('hdServer').getValue('name'),
                          }
                        : undefined;

                    let groups: IResponse.IObject[] = (value.getValue('groups') || []).map((value1, index1, array1) => {
                        return {
                            objectId: value1.id,
                            name: value1.getValue('name'),
                        };
                    });

                    let config: IResponse.IDevice.ICameraCMS | IResponse.IDevice.ICameraFRSManager | IResponse.IDevice.ICameraFRS | IDB.ICameraHanwha = undefined;
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
                                    };
                                    break;
                                case Enum.EDeviceModelIsap.frsManager:
                                    let frsManagerConfig: IDB.ICameraFRSManager = value.getValue('config') as IDB.ICameraFRSManager;
                                    config = {
                                        server: {
                                            objectId: frsManagerConfig.server.id,
                                            name: frsManagerConfig.server.getValue('name'),
                                        },
                                        frsId: frsManagerConfig.frsId,
                                        frsIp: frsManagerConfig.frsIp,
                                        sourceId: frsManagerConfig.sourceId,
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
                        groups: groups,
                        name: value.getValue('name'),
                        brand: Enum.EDeviceBrand[value.getValue('brand')],
                        model: model,
                        mode: Enum.EDeviceMode[value.getValue('mode')],
                        config: config,
                        demoServer: demoServer,
                        hdServer: hdServer,
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

type OutputD = IResponse.IMultiData;

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
            let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

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
 *
 */
interface IPosition {
    site: IDB.LocationSite;
    area: IDB.LocationArea;
    groups: IDB.DeviceGroup[];
}

/**
 * Get position
 * @param mode
 * @param areaId
 * @param groupId
 */
async function GetPosition(mode: Enum.EDeviceMode, areaId: string, groupIds: string[]): Promise<IPosition> {
    try {
        if (groupIds) {
            let groups: IDB.DeviceGroup[] = await new Parse.Query(IDB.DeviceGroup)
                .containedIn('objectId', groupIds)
                .find()
                .fail((e) => {
                    throw e;
                });

            let group: IDB.DeviceGroup = groups.find((value, index, array) => {
                return value.getValue('area').id !== array[0].getValue('area').id;
            });
            if (group) {
                throw Errors.throw(Errors.CustomBadRequest, ['group must in same area']);
            }

            group = groups.find((value, index, array) => {
                return value.getValue('mode') !== mode;
            });
            if (group) {
                throw Errors.throw(Errors.CustomBadRequest, ['group mode must same with device']);
            }

            if (groups.length > 0) {
                return {
                    site: groups[0].getValue('site'),
                    area: groups[0].getValue('area'),
                    groups: groups,
                };
            }
        }

        if (areaId) {
            let area: IDB.LocationArea = await new Parse.Query(IDB.LocationArea)
                .equalTo('objectId', areaId)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!area) {
                throw Errors.throw(Errors.CustomBadRequest, ['area not found']);
            }

            return {
                site: area.getValue('site'),
                area: area,
                groups: groupIds && groupIds.length === 0 ? [] : undefined,
            };
        }

        return {
            site: undefined,
            area: undefined,
            groups: undefined,
        };
    } catch (e) {
        throw e;
    }
}

/**
 * Get Hanwha version
 * @param config
 */
async function GetHanwhaVersion(config: IDB.ICameraHanwha): Promise<string> {
    try {
        let hanwha: PeopleCounting.Hanwha = new PeopleCounting.Hanwha();
        hanwha.config = {
            protocol: config.protocol,
            ip: config.ip,
            port: config.port,
            account: config.account,
            password: config.password,
        };

        hanwha.Initialization();

        let version = await hanwha.GetVersion();

        return version;
    } catch (e) {
        throw Errors.throw(Errors.CustomBadRequest, [e]);
    }
}

/**
 *
 * @param device
 * @param config
 */
async function HanwhaCamera(device: IDB.Device, config: IDB.ICameraHanwha): Promise<IDB.Device> {
    try {
        let version = await GetHanwhaVersion(config);

        device.setValue('config', config);

        return device;
    } catch (e) {
        throw e;
    }
}

/**
 *
 * @param device
 * @param camera
 */
async function FRSManagerCamera(device: IDB.Device, camera: IRequest.IDevice.ICameraFRSManager): Promise<IDB.Device> {
    try {
        let server: IDB.ServerFRSManager = await new Parse.Query(IDB.ServerFRSManager)
            .equalTo('objectId', camera.serverId)
            .first()
            .fail((e) => {
                throw e;
            });
        if (!server) {
            throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
        }

        let config: IDB.ICameraFRSManager = {
            server: server,
            frsId: camera.frsId,
            frsIp: camera.frsIp,
            sourceId: camera.sourceId,
        };

        device.setValue('brand', Enum.EDeviceBrand.isap);
        device.setValue('model', Enum.EDeviceModelIsap.frsManager);
        device.setValue('config', config);

        return device;
    } catch (e) {
        throw e;
    }
}

/**
 *
 * @param device
 * @param camera
 */
async function FRSCamera(device: IDB.Device, camera: IRequest.IDevice.ICameraFRS): Promise<IDB.Device> {
    try {
        let server: IDB.ServerFRS = await new Parse.Query(IDB.ServerFRS)
            .equalTo('objectId', camera.serverId)
            .first()
            .fail((e) => {
                throw e;
            });
        if (!server) {
            throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
        }

        let config: IDB.ICameraFRS = {
            server: server,
            sourceid: camera.sourceid,
        };

        device.setValue('brand', Enum.EDeviceBrand.isap);
        device.setValue('model', Enum.EDeviceModelIsap.frs);
        device.setValue('config', config);

        return device;
    } catch (e) {
        throw e;
    }
}

/**
 *
 * @param device
 * @param camera
 */
async function CMSCamera(device: IDB.Device, camera: IRequest.IDevice.ICameraCMS): Promise<IDB.Device> {
    try {
        let server: IDB.ServerCMS = await new Parse.Query(IDB.ServerCMS)
            .equalTo('objectId', camera.serverId)
            .first()
            .fail((e) => {
                throw e;
            });
        if (!server) {
            throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
        }

        let config: IDB.ICameraCMS = {
            server: server,
            nvrId: camera.nvrId,
            channelId: camera.channelId,
        };

        device.setValue('brand', Enum.EDeviceBrand.isap);
        device.setValue('model', Enum.EDeviceModelIsap.cms);
        device.setValue('config', config);

        return device;
    } catch (e) {
        throw e;
    }
}

/**
 *
 * @param device
 * @param demoServerId
 */
async function DemoServer(device: IDB.Device, demoServerId: string): Promise<IDB.Device> {
    try {
        let demoServer: IDB.ServerDemographic = await new Parse.Query(IDB.ServerDemographic).equalTo('objectId', demoServerId).first();
        if (!demoServer) {
            throw Errors.throw(Errors.CustomBadRequest, ['demographic server not found']);
        }
        device.setValue('demoServer', demoServer);

        return device;
    } catch (e) {
        throw e;
    }
}

/**
 *
 * @param device
 * @param hdServerId
 */
async function HdServer(device: IDB.Device, hdServerId: string): Promise<IDB.Device> {
    try {
        let hdServer: IDB.ServerHumanDetection = await new Parse.Query(IDB.ServerHumanDetection).equalTo('objectId', hdServerId).first();
        if (!hdServer) {
            throw Errors.throw(Errors.CustomBadRequest, ['human detection server not found']);
        }
        device.setValue('hdServer', hdServer);

        return device;
    } catch (e) {
        throw e;
    }
}

/**
 * Create device
 * @param mode
 * @param value
 */
export async function Create(mode: Enum.EDeviceMode, value: any): Promise<IDB.Device> {
    try {
        // await LicenseCheck(mode)

        let position = await GetPosition(mode, value.areaId, value.groupIds);

        let device: IDB.Device = await new Parse.Query(IDB.Device)
            .equalTo('customId', value.customId)
            .equalTo('mode', mode)
            .first()
            .fail((e) => {
                throw e;
            });
        if (device) {
            throw Errors.throw(Errors.CustomBadRequest, ['duplicate custom id']);
        }

        device = new IDB.Device();

        device.setValue('customId', value.customId);
        device.setValue('site', position.site);
        device.setValue('area', position.area);
        device.setValue('groups', position.groups);
        device.setValue('name', value.name);
        device.setValue('brand', value.brand);
        device.setValue('model', value.model);
        device.setValue('mode', mode);
        device.setValue('direction', value.direction);
        device.setValue('rois', value.rois);
        device.setValue('x', 0);
        device.setValue('y', 0);
        device.setValue('angle', 0);
        device.setValue('visibleDistance', 0);
        device.setValue('visibleAngle', 0);
        device.setValue('dataWindowX', 0);
        device.setValue('dataWindowY', 0);

        if (value.brand === Enum.EDeviceBrand.hanwha) {
            switch (mode) {
                case Enum.EDeviceMode.peopleCounting:
                    device = await HanwhaCamera(device, value.config);
                    break;
            }
        } else if (value.brand === Enum.EDeviceBrand.isap) {
            if (value.model === Enum.EDeviceModelIsap.cms) {
                switch (mode) {
                    case Enum.EDeviceMode.humanDetection:
                    case Enum.EDeviceMode.heatmap:
                        device = await HdServer(device, value.hdServerId);
                        device = await CMSCamera(device, value.config);
                        break;
                }
            } else if (value.model === Enum.EDeviceModelIsap.frs) {
                switch (mode) {
                    case Enum.EDeviceMode.demographic:
                        device = await DemoServer(device, value.demoServerId);
                    case Enum.EDeviceMode.peopleCounting:
                        device = await FRSCamera(device, value.config);
                        break;
                }
            } else if (value.model === Enum.EDeviceModelIsap.frsManager) {
                switch (mode) {
                    case Enum.EDeviceMode.demographic:
                        device = await DemoServer(device, value.demoServerId);
                    case Enum.EDeviceMode.dwellTime:
                    case Enum.EDeviceMode.visitor:
                    case Enum.EDeviceMode.peopleCounting:
                        device = await FRSManagerCamera(device, value.config);
                        break;
                }
            }
        }

        await device.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return device;
    } catch (e) {
        throw e;
    }
}

/**
 * Update device
 * @param mode
 * @param value
 */
export async function Update(mode: Enum.EDeviceMode, value: any): Promise<IDB.Device> {
    try {
        let position = await GetPosition(mode, value.areaId, value.groupIds);

        let device: IDB.Device = await new Parse.Query(IDB.Device)
            .equalTo('objectId', value.objectId)
            .equalTo('mode', mode)
            .include('groups')
            .first()
            .fail((e) => {
                throw e;
            });
        if (!device) {
            throw Errors.throw(Errors.CustomBadRequest, ['device not found']);
        }
        if (device.getValue('brand') !== value.brand || device.getValue('model') !== value.model) {
            throw Errors.throw(Errors.CustomBadRequest, ['can not change device brand or model']);
        }

        if (value.areaId === '') {
            device.unset('area');
            device.unset('site');
            device.setValue('groups', []);
        }
        if (position.area) {
            device.setValue('site', position.site);
            device.setValue('area', position.area);

            if (position.groups) {
                device.setValue('groups', position.groups);
            } else if (device.getValue('groups')) {
                let group = device.getValue('groups').find((value, index, array) => {
                    return value.getValue('area').id !== position.area.id;
                });
                if (group) {
                    device.setValue('groups', []);
                }
            }
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
        if (value.brand === Enum.EDeviceBrand.hanwha) {
            switch (mode) {
                case Enum.EDeviceMode.peopleCounting:
                    if (value.config) device = await HanwhaCamera(device, value.config);
                    break;
            }
        } else if (value.brand === Enum.EDeviceBrand.isap) {
            if (value.model === Enum.EDeviceModelIsap.cms) {
                switch (mode) {
                    case Enum.EDeviceMode.humanDetection:
                    case Enum.EDeviceMode.heatmap:
                        if (value.hdServerId) device = await HdServer(device, value.hdServerId);
                        if (value.config) device = await CMSCamera(device, value.config);
                        break;
                }
            } else if (value.model === Enum.EDeviceModelIsap.frs) {
                switch (mode) {
                    case Enum.EDeviceMode.demographic:
                        if (value.demoServerId) device = await DemoServer(device, value.demoServerId);
                    case Enum.EDeviceMode.peopleCounting:
                        if (value.config) device = await FRSCamera(device, value.config);
                        break;
                }
            } else if (value.model === Enum.EDeviceModelIsap.frsManager) {
                switch (mode) {
                    case Enum.EDeviceMode.demographic:
                        if (value.demoServerId) device = await DemoServer(device, value.demoServerId);
                    case Enum.EDeviceMode.dwellTime:
                    case Enum.EDeviceMode.visitor:
                    case Enum.EDeviceMode.peopleCounting:
                        if (value.config) device = await FRSManagerCamera(device, value.config);
                        break;
                }
            }
        }
        if (value.direction) {
            device.setValue('direction', value.direction);
        }
        if (value.rois) {
            device.setValue('rois', value.rois);
        }

        await device.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return device;
    } catch (e) {
        throw e;
    }
}

/**
 * Convert device mode to prodect id
 * @param mode
 */
function DeviceMode2ProdectId(mode: Enum.EDeviceMode): string {
    try {
        let productId: string = '';
        switch (mode) {
            case Enum.EDeviceMode.humanDetection:
                productId = Config.deviceHumanDetection.productId;
                break;
            case Enum.EDeviceMode.peopleCounting:
                productId = Config.devicePeopleCounting.productId;
                break;
            case Enum.EDeviceMode.demographic:
                productId = Config.deviceDemographic.productId;
                break;
            case Enum.EDeviceMode.dwellTime:
                productId = Config.deviceDwellTime.productId;
                break;
            case Enum.EDeviceMode.heatmap:
                productId = Config.deviceHeatmap.productId;
                break;
            case Enum.EDeviceMode.visitor:
                productId = Config.deviceVisitor.productId;
                break;
            default:
                throw 'Unrecognized device mode';
        }

        return productId;
    } catch (e) {
        throw e;
    }
}

/**
 * Check license
 * @param mode
 */
async function LicenseCheck(mode: Enum.EDeviceMode): Promise<void> {
    try {
        let license = await licenseService.getLicense();
        let licenseSummary = license.summary[DeviceMode2ProdectId(mode)];

        let limit: number = licenseSummary ? licenseSummary.totalCount : 0;
        let count: number = await new Parse.Query(IDB.Device)
            .equalTo('mdoe', mode)
            .count()
            .fail((e) => {
                throw e;
            });

        if (limit <= count) {
            throw Errors.throw(Errors.CustomBadRequest, ['upper limit is full']);
        }
    } catch (e) {
        throw e;
    }
}

/**
 * Unbinding when site was delete
 */
IDB.LocationSite.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let devices: IDB.Device[] = await new Parse.Query(IDB.Device)
                    .equalTo('site', x.data)
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    devices.map(async (value, index, array) => {
                        value.unset('site');
                        value.unset('area');
                        value.setValue('groups', []);

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
 * Unbinding when area was delete
 */
IDB.LocationArea.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let devices: IDB.Device[] = await new Parse.Query(IDB.Device)
                    .equalTo('area', x.data)
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    devices.map(async (value, index, array) => {
                        value.unset('area');
                        value.setValue('groups', []);

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
 * Unbinding when device group was delete
 */
IDB.DeviceGroup.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let devices: IDB.Device[] = await new Parse.Query(IDB.Device)
                    .containedIn('groups', [x.data])
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    devices.map(async (value, index, array) => {
                        let groups: IDB.DeviceGroup[] = value.getValue('groups').filter((value1, index1, array1) => {
                            return value1.id !== x.data.id;
                        });
                        value.setValue('groups', groups);

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
 * Delete when human detection server was delete
 */
IDB.ServerHumanDetection.notice$
    .merge(IDB.ServerDemographic.notice$)
    .merge(IDB.ServerCMS.notice$)
    .merge(IDB.ServerFRS.notice$)
    .merge(IDB.ServerFRSManager.notice$)
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let query: Parse.Query<IDB.Device> = new Parse.Query(IDB.Device);

                switch (x.data.className) {
                    case 'ServerHumanDetection':
                        query.equalTo('hdServer', x.data);
                        break;
                    case 'ServerDemographic':
                        query.equalTo('demoServer', x.data);
                        break;
                    default:
                        query.equalTo('config.server.objectId', x.data.id);
                }

                let devices: IDB.Device[] = await query.find().fail((e) => {
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
                Print.Log(e, new Error(), 'error');
            }
        },
    });

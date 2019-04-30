import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Utility } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import licenseService from 'services/license';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ILocation.IDeviceC;

type OutputC = IResponse.ILocation.IDeviceC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Admin],
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let floor: IDB.LocationFloor = await new Parse.Query(IDB.LocationFloor).get(_input.floorId).fail((e) => {
                throw e;
            });
            if (!floor) {
                throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
            }

            let camera: IDB.Camera = undefined;
            if (_input.type === Enum.EDeviceType.camera) {
                if (!_input.cameraId) {
                    throw Errors.throw(Errors.CustomBadRequest, ['need camera id']);
                }

                camera = await new Parse.Query(IDB.Camera).get(_input.cameraId).fail((e) => {
                    throw e;
                });
                if (!camera) {
                    throw Errors.throw(Errors.CustomBadRequest, ['camera not found']);
                }

                let cameraDevice: IDB.LocationDevice = await new Parse.Query(IDB.LocationDevice)
                    .equalTo('isDeleted', false)
                    .equalTo('camera', camera)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (cameraDevice) {
                    throw Errors.throw(Errors.CustomBadRequest, ['camera was used']);
                }
            }

            let extension = File.GetExtension(_input.iconBase64);
            if (!extension || extension.type !== 'image') {
                throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
            }

            let device: IDB.LocationDevice = new IDB.LocationDevice();

            device.setValue('creator', data.user);
            device.setValue('isDeleted', false);
            device.setValue('floor', floor);
            device.setValue('type', _input.type);
            device.setValue('camera', camera);
            device.setValue('name', _input.name);
            device.setValue('iconSrc', '');
            device.setValue('iconWidth', _input.iconWidth);
            device.setValue('iconHeight', _input.iconHeight);
            device.setValue('x', _input.x);
            device.setValue('y', _input.y);
            device.setValue('angle', _input.angle || 0);
            device.setValue('visibleDistance', _input.visibleDistance || 0);
            device.setValue('visibleAngle', _input.visibleAngle || 0);
            device.setValue('dataWindowX', _input.dataWindowX);
            device.setValue('dataWindowY', _input.dataWindowY);

            await device.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            let iconSrc: string = `${extension.type}s/${device.id}_device_${device.createdAt.getTime()}.${extension.extension}`;
            File.WriteBase64File(`${File.assetsPath}/${iconSrc}`, _input.iconBase64);

            device.setValue('iconSrc', iconSrc);

            await device.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Utility.ReStartServer();

            return {
                objectId: device.id,
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
type InputR = IRequest.IDataList & IRequest.ILocation.IDeviceR;

type OutputR = IResponse.IDataList<IResponse.ILocation.IDeviceR>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _paging: IRequest.IPaging = _input.paging || { page: 1, pageSize: 10 };
            let _page: number = _paging.page || 1;
            let _pageSize: number = _paging.pageSize || 10;

            let query: Parse.Query<IDB.LocationDevice> = new Parse.Query(IDB.LocationDevice).equalTo('isDeleted', false);

            if (_input.floorId) {
                let floor: IDB.LocationFloor = new IDB.LocationFloor();
                floor.id = _input.floorId;

                query = query.equalTo('floor', floor);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _pageSize);

            let devices: IDB.LocationDevice[] = await query
                .skip((_page - 1) * _pageSize)
                .limit(_pageSize)
                .find()
                .fail((e) => {
                    throw e;
                });

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _page,
                    pageSize: _pageSize,
                },
                results: devices.map((value, index, array) => {
                    return {
                        objectId: value.id,
                        floorId: value.getValue('floor').id,
                        type: Enum.EDeviceType[value.getValue('type')],
                        cameraId: value.getValue('camera') ? value.getValue('camera').id : '',
                        name: value.getValue('name'),
                        iconSrc: value.getValue('iconSrc'),
                        iconWidth: value.getValue('iconWidth'),
                        iconHeight: value.getValue('iconHeight'),
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
 * Action update
 */
type InputU = IRequest.ILocation.IDeviceU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.Admin],
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let device: IDB.LocationDevice = await new Parse.Query(IDB.LocationDevice).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!device) {
                throw Errors.throw(Errors.CustomBadRequest, ['device not found']);
            }

            let floor: IDB.LocationFloor = undefined;
            if (_input.floorId) {
                floor = await new Parse.Query(IDB.LocationFloor).get(_input.floorId).fail((e) => {
                    throw e;
                });
                if (!floor) {
                    throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
                }
            }

            let camera: IDB.Camera = undefined;
            if (_input.type === Enum.EDeviceType.camera) {
                if (!_input.cameraId) {
                    throw Errors.throw(Errors.CustomBadRequest, ['need camera id']);
                }

                camera = await new Parse.Query(IDB.Camera).get(_input.cameraId).fail((e) => {
                    throw e;
                });
                if (!camera) {
                    throw Errors.throw(Errors.CustomBadRequest, ['camera not found']);
                }

                if (!device.getValue('camera') || _input.cameraId !== device.getValue('camera').id) {
                    let cameraDevice: IDB.LocationDevice = await new Parse.Query(IDB.LocationDevice)
                        .equalTo('isDeleted', false)
                        .equalTo('camera', camera)
                        .first()
                        .fail((e) => {
                            throw e;
                        });
                    if (cameraDevice) {
                        throw Errors.throw(Errors.CustomBadRequest, ['camera was used']);
                    }
                }
            }

            let extension = _input.iconBase64 ? File.GetExtension(_input.iconBase64) : { extension: 'aa', type: 'image' };
            if (!extension || extension.type !== 'image') {
                throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
            }

            if (_input.floorId) {
                device.setValue('floor', floor);
            }
            if (_input.type || _input.type === 0) {
                device.setValue('type', _input.type);
                device.setValue('camera', camera);
            }
            if (_input.name) {
                device.setValue('name', _input.name);
            }
            if (_input.iconBase64) {
                let iconSrc: string = device.getValue('iconSrc');
                File.WriteBase64File(`${File.assetsPath}/${iconSrc}`, _input.iconBase64);
            }
            if (_input.iconWidth || _input.iconWidth === 0) {
                device.setValue('iconWidth', _input.iconWidth);
            }
            if (_input.iconHeight || _input.iconHeight === 0) {
                device.setValue('iconHeight', _input.iconHeight);
            }
            if (_input.x || _input.x === 0) {
                device.setValue('x', _input.x);
            }
            if (_input.y || _input.y === 0) {
                device.setValue('y', _input.y);
            }
            if (_input.angle || _input.angle === 0) {
                device.setValue('angle', _input.angle || 0);
            }
            if (_input.visibleDistance || _input.visibleDistance === 0) {
                device.setValue('visibleDistance', _input.visibleDistance || 0);
            }
            if (_input.visibleAngle || _input.visibleAngle === 0) {
                device.setValue('visibleAngle', _input.visibleAngle || 0);
            }
            if (_input.dataWindowX || _input.dataWindowX === 0) {
                device.setValue('dataWindowX', _input.dataWindowX);
            }
            if (_input.dataWindowY || _input.dataWindowY === 0) {
                device.setValue('dataWindowY', _input.dataWindowY);
            }

            await device.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Utility.ReStartServer();

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.ILocation.IDeviceD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.Admin],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;

            let device: IDB.LocationDevice = await new Parse.Query(IDB.LocationDevice).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!device) {
                throw Errors.throw(Errors.CustomBadRequest, ['device not found']);
            }

            device.setValue('isDeleted', true);
            device.setValue('deleter', data.user);

            await device.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Utility.ReStartServer();

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

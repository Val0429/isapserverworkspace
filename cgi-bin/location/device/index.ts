import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { File, Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ILocation.IDeviceIndexC;

type OutputC = IResponse.ILocation.IDeviceIndexC;

action.post(
    {
        inputType: 'InputC',
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let iconExtension: string = File.GetExtension(_input.iconBase64);
        if (!iconExtension) {
            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
        }

        let camera: IDB.Camera = undefined;
        if (_input.type === Enum.DeviceType.camera) {
            if (!_input.cameraId) {
                throw Errors.throw(Errors.CustomBadRequest, ['need camera id']);
            }

            camera = await new Parse.Query(IDB.Camera).get(_input.cameraId).fail((e) => {
                throw e;
            });
            if (!camera) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera not found']);
            }
        }

        let site: IDB.LocationSite = await new Parse.Query(IDB.LocationSite).get(_input.siteId).fail((e) => {
            throw e;
        });
        if (!site) {
            throw Errors.throw(Errors.CustomBadRequest, ['site not found']);
        }

        let device: IDB.LocationDevice = new IDB.LocationDevice();

        device.setValue('creator', data.user);
        device.setValue('isDeleted', false);
        device.setValue('site', site);
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

        await device.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        let iconSrc: string = `images/${device.id}_device_${device.createdAt.getTime()}.${iconExtension}`;
        File.WriteBase64File(`${File.assetsPath}/${iconSrc}`, _input.iconBase64);

        device.setValue('iconSrc', iconSrc);

        await device.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return {
            deviceId: device.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.ILocation.IDeviceIndexR;

type OutputR = IResponse.IDataList<IResponse.ILocation.IDeviceIndexR[]>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<IDB.LocationDevice> = new Parse.Query(IDB.LocationDevice).equalTo('isDeleted', false);

        if (_input.siteId) {
            let site: IDB.LocationSite = new IDB.LocationSite();
            site.id = _input.siteId;

            query = query.equalTo('site', site);
        }

        let total: number = await query.count().fail((e) => {
            throw e;
        });

        let devices: IDB.LocationDevice[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .find()
            .fail((e) => {
                throw e;
            });

        return {
            total: total,
            page: _page,
            count: _count,
            content: devices.map((value, index, array) => {
                return {
                    siteId: value.getValue('site').id,
                    deviceId: value.id,
                    type: value.getValue('type'),
                    cameraId: value.getValue('camera').id,
                    name: value.getValue('name'),
                    iconSrc: value.getValue('iconSrc'),
                    iconWidth: value.getValue('iconWidth'),
                    iconHeight: value.getValue('iconHeight'),
                    x: value.getValue('x'),
                    y: value.getValue('y'),
                    angle: value.getValue('angle'),
                    visibleDistance: value.getValue('visibleDistance'),
                    visibleAngle: value.getValue('visibleAngle'),
                };
            }),
        };
    },
);

/**
 * Action update
 */
type InputU = IRequest.ILocation.IDeviceIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let device: IDB.LocationDevice = await new Parse.Query(IDB.LocationDevice).get(_input.deviceId).fail((e) => {
            throw e;
        });
        if (!device) {
            throw Errors.throw(Errors.CustomBadRequest, ['device not found']);
        }

        let iconExtension: string = _input.iconBase64 ? File.GetExtension(_input.iconBase64) : 'aa';
        if (!iconExtension) {
            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
        }

        if (_input.type) {
            device.setValue('type', _input.type);

            if (_input.type === Enum.DeviceType.camera) {
                if (!_input.cameraId) {
                    throw Errors.throw(Errors.CustomBadRequest, ['need camera id']);
                }

                let camera: IDB.Camera = await new Parse.Query(IDB.Camera).get(_input.cameraId).fail((e) => {
                    throw e;
                });
                if (!camera) {
                    throw Errors.throw(Errors.CustomBadRequest, ['camera not found']);
                }

                device.setValue('camera', camera);
            }
        }
        if (_input.name) {
            device.setValue('name', _input.name);
        }
        if (_input.iconWidth) {
            device.setValue('iconWidth', _input.iconWidth);
        }
        if (_input.iconHeight) {
            device.setValue('iconHeight', _input.iconHeight);
        }
        if (_input.x) {
            device.setValue('x', _input.x);
        }
        if (_input.y) {
            device.setValue('y', _input.y);
        }
        if (_input.angle) {
            device.setValue('angle', _input.angle);
        }
        if (_input.visibleDistance) {
            device.setValue('visibleDistance', _input.visibleDistance);
        }
        if (_input.visibleAngle) {
            device.setValue('visibleAngle', _input.visibleAngle);
        }
        if (_input.iconBase64) {
            let iconSrc: string = device.getValue('iconSrc');
            File.WriteBase64File(`${File.assetsPath}/${iconSrc}`, _input.iconBase64);
        }

        await device.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        await device.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return new Date();
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.ILocation.IDeviceIndexD;

type OutputD = Date;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _deviceIds: string[] = [].concat(data.parameters.deviceIds);

        _deviceIds = _deviceIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _deviceIds.map<any>((value, index, array) => {
            return new Parse.Query(IDB.LocationDevice).get(value);
        });

        let devices: IDB.LocationDevice[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = devices.map<any>((value, index, array) => {
            value.setValue('isDeleted', true);
            value.setValue('deleter', data.user);

            return value.save(null, { useMasterKey: true });
        });

        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return new Date();
    },
);

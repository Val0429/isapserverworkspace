import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Regex, Utility } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import licenseService from 'services/license';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ICamera.IIndexC;

type OutputC = IResponse.ICamera.IIndexC;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;
        let license = await licenseService.getLicense();

        let count: number = await new Parse.Query(IDB.Camera).equalTo('isDeleted', false).count();
        let limit: number = license.licenses.reduce((prev, curr, index, array) => {
            return prev + curr.count;
        }, 0);
        if (limit <= count) {
            throw Errors.throw(Errors.CustomBadRequest, ['upper limit is full']);
        }

        if (!Regex.IsIp(_input.config.ip)) {
            throw Errors.throw(Errors.CustomBadRequest, ['camera ip error']);
        }
        if (!Regex.IsPort(_input.config.port.toString())) {
            throw Errors.throw(Errors.CustomBadRequest, ['camera port error']);
        }

        let camera: IDB.Camera = new IDB.Camera();

        camera.setValue('creator', data.user);
        camera.setValue('isDeleted', false);
        camera.setValue('name', _input.name);
        camera.setValue('mode', _input.mode);
        camera.setValue('type', _input.type);
        camera.setValue('config', _input.config);

        await camera.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        Utility.ReStartServer();

        return {
            cameraId: camera.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.ICamera.IIndexR[]>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<IDB.Camera> = new Parse.Query(IDB.Camera).equalTo('isDeleted', false);

        let total: number = await query.count().fail((e) => {
            throw e;
        });

        let cameras: IDB.Camera[] = await query
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
            content: cameras.map((value, index, array) => {
                return {
                    cameraId: value.id,
                    name: value.getValue('name'),
                    mode: value.getValue('mode'),
                    type: value.getValue('type'),
                    config: value.getValue('config'),
                };
            }),
        };
    },
);

/**
 * Action update
 */
type InputU = IRequest.ICamera.IIndexU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let camera: IDB.Camera = await new Parse.Query(IDB.Camera).get(_input.cameraId).fail((e) => {
            throw e;
        });
        if (!camera) {
            throw Errors.throw(Errors.CustomBadRequest, ['camera not found']);
        }

        if (_input.name) {
            camera.setValue('name', _input.name);
        }
        if (_input.mode) {
            camera.setValue('mode', _input.mode);
        }
        if (_input.type) {
            camera.setValue('type', _input.type);
        }
        if (_input.config) {
            if (!Regex.IsIp(_input.config.ip)) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera ip error']);
            }
            if (!Regex.IsPort(_input.config.port.toString())) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera port error']);
            }

            camera.setValue('config', _input.config);
        }

        await camera.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        Utility.ReStartServer();

        return new Date();
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.ICamera.IIndexD;

type OutputD = Date;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _cameraIds: string[] = [].concat(data.parameters.cameraIds);

        _cameraIds = _cameraIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _cameraIds.map<any>((value, index, array) => {
            return new Parse.Query(IDB.Camera).get(value);
        });

        let cameras: IDB.Camera[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = cameras.map<any>((value, index, array) => {
            value.setValue('isDeleted', true);
            value.setValue('deleter', data.user);

            return value.save(null, { useMasterKey: true });
        });

        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        let devices: IDB.LocationDevice[] = await new Parse.Query(IDB.LocationDevice)
            .containedIn('camera', cameras)
            .find()
            .fail((e) => {
                throw e;
            });

        tasks = devices.map<any>((value, index, array) => {
            value.setValue('isDeleted', true);
            value.setValue('deleter', data.user);

            return value.save(null, { useMasterKey: true });
        });

        Utility.ReStartServer();

        return new Date();
    },
);

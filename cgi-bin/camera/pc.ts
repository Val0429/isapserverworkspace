import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Regex, Print } from '../../custom/helpers';
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
type InputC = IRequest.ICamera.IPcC;

type OutputC = IResponse.ICamera.IPcC;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            if (!Regex.IsIp(_input.config.ip)) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera ip error']);
            }
            if (!Regex.IsPort(_input.config.port.toString())) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera port error']);
            }

            let camera: IDB.Camera = new IDB.Camera();

            camera.setValue('name', _input.name);
            camera.setValue('mode', Enum.ECameraMode.peopleCounting);
            camera.setValue('type', Enum.ECameraType.uniview);
            camera.setValue('config', _input.config);

            await camera.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return {
                objectId: camera.id,
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
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.ICamera.IPcR>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _paging: IRequest.IPaging = _input.paging || { page: 1, pageSize: 10 };
            let _page: number = _paging.page || 1;
            let _pageSize: number = _paging.pageSize || 10;

            let query: Parse.Query<IDB.Camera> = new Parse.Query(IDB.Camera).equalTo('type', Enum.ECameraType.uniview).equalTo('mode', Enum.ECameraMode.peopleCounting);

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _pageSize);

            let cameras: IDB.Camera[] = await query
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
                results: cameras.map((value, index, array) => {
                    return {
                        objectId: value.id,
                        name: value.getValue('name'),
                        mode: Enum.ECameraMode[value.getValue('mode')],
                        type: Enum.ECameraType[value.getValue('type')],
                        config: value.getValue('config') as IDB.IConfigUniviewCamera,
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
type InputU = IRequest.ICamera.IPcU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let camera: IDB.Camera = await new Parse.Query(IDB.Camera).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!camera) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera not found']);
            }
            if (camera.getValue('type') !== Enum.ECameraType.uniview || camera.getValue('mode') !== Enum.ECameraMode.peopleCounting) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera must use in people counting']);
            }

            if (_input.name) {
                camera.setValue('name', _input.name);
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
type InputD = IRequest.ICamera.IPcD;

type OutputD = Date;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;

            let camera: IDB.Camera = await new Parse.Query(IDB.Camera).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!camera) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera not found']);
            }
            if (camera.getValue('type') !== Enum.ECameraType.uniview || camera.getValue('mode') !== Enum.ECameraMode.peopleCounting) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera must use in people counting']);
            }

            let devices: IDB.LocationDevice[] = await new Parse.Query(IDB.LocationDevice)
                .equalTo('isDeleted', false)
                .equalTo('camera', camera)
                .find()
                .fail((e) => {
                    throw e;
                });

            await Promise.all(
                devices.map(async (value, index, array) => {
                    value.setValue('isDeleted', true);
                    value.setValue('deleter', data.user);

                    await value.save(null, { useMasterKey: true }).fail((e) => {
                        throw e;
                    });
                }),
            );

            await camera.destroy({ useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

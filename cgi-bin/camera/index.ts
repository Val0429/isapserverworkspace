import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, Utility } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ICamera.IIndexC;

type OutputC = IResponse.ICamera.IIndexC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Admin],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let camera: IDB.Camera = new IDB.Camera();

            camera.setValue('creator', data.user);
            camera.setValue('isDeleted', false);
            camera.setValue('name', _input.name);
            camera.setValue('stationId', _input.stationId);

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

type OutputR = IResponse.IDataList<IResponse.ICamera.IIndexR>;

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

            let query: Parse.Query<IDB.Camera> = new Parse.Query(IDB.Camera).equalTo('isDeleted', false);

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
                        stationId: value.getValue('stationId'),
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
type InputU = IRequest.ICamera.IIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.Admin],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let camera: IDB.Camera = await new Parse.Query(IDB.Camera).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!camera) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera not found']);
            }

            if (_input.name) {
                camera.setValue('name', _input.name);
            }
            if (_input.stationId || _input.stationId === 0) {
                camera.setValue('stationId', _input.stationId);
            }

            await camera.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            // Utility.ReStartServer();

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
type InputD = IRequest.ICamera.IIndexD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.Admin],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;

            let camera: IDB.Camera = await new Parse.Query(IDB.Camera).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!camera) {
                throw Errors.throw(Errors.CustomBadRequest, ['camera not found']);
            }

            let devices: IDB.LocationDevice[] = await new Parse.Query(IDB.LocationDevice)
                .equalTo('camera', camera)
                .equalTo('isDeleted', false)
                .find()
                .fail((e) => {
                    throw e;
                });

            camera.setValue('isDeleted', true);
            camera.setValue('deleter', data.user);

            await camera.save(null, { useMasterKey: true }).fail((e) => {
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
            ).catch((e) => {
                throw e;
            });

            // Utility.ReStartServer();

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

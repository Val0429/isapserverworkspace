import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.ICamera.ILocation;

type OutputR = IResponse.IDataList<IResponse.ICamera.ILocation>;

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

            let total: number = 0;
            let totalPage: number = 0;
            let cameras: IDB.Camera[] = [];
            let devices: IDB.LocationDevice[] = [];
            if (_input.type === 'inMap') {
                let query: Parse.Query<IDB.LocationDevice> = new Parse.Query(IDB.LocationDevice).equalTo('isDeleted', false);

                if (_input.mode || _input.mode === 0) {
                    query.equalTo('mode', _input.mode);
                }

                total = await query.count().fail((e) => {
                    throw e;
                });
                totalPage = Math.ceil(total / _pageSize);

                devices = await query
                    .include(['floor', 'area', 'camera'])
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                cameras = devices.map((value, index, array) => {
                    return value.getValue('camera');
                });
            } else if (_input.type === 'outMap') {
                devices = await new Parse.Query(IDB.LocationDevice)
                    .equalTo('isDeleted', false)
                    .equalTo('type', Enum.EDeviceType.camera)
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                let ids: string[] = devices.map((value, index, array) => {
                    return value.getValue('camera').id;
                });

                let query: Parse.Query<IDB.Camera> = new Parse.Query(IDB.Camera).notContainedIn('objectId', ids);

                if (_input.mode || _input.mode === 0) {
                    query.equalTo('mode', _input.mode);
                }

                total = await query.count().fail((e) => {
                    throw e;
                });
                totalPage = Math.ceil(total / _pageSize);

                cameras = await query
                    .skip((_page - 1) * _pageSize)
                    .limit(_pageSize)
                    .find()
                    .fail((e) => {
                        throw e;
                    });
            } else {
                let query: Parse.Query<IDB.Camera> = new Parse.Query(IDB.Camera);

                if (_input.mode || _input.mode === 0) {
                    query.equalTo('mode', _input.mode);
                }

                total = await query.count().fail((e) => {
                    throw e;
                });
                totalPage = Math.ceil(total / _pageSize);

                cameras = await query
                    .skip((_page - 1) * _pageSize)
                    .limit(_pageSize)
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                devices = await new Parse.Query(IDB.LocationDevice)
                    .containedIn('camera', cameras)
                    .equalTo('isDeleted', false)
                    .include(['floor', 'area'])
                    .find()
                    .fail((e) => {
                        throw e;
                    });
            }

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _page,
                    pageSize: _pageSize,
                },
                results: cameras.map((value, index, array) => {
                    let device: IDB.LocationDevice = devices.find((value1, index1, array1) => {
                        return value1.getValue('camera').id === value.id;
                    });

                    return {
                        objectId: value.id,
                        name: value.getValue('name'),
                        floorId: device ? device.getValue('floor').id : '',
                        floorName: device ? device.getValue('floor').getValue('name') : '',
                        floorNo: device ? device.getValue('floor').getValue('floorNo') : 0,
                        areaId: device ? device.getValue('area').id : '',
                        areaName: device ? device.getValue('area').getValue('name') : '',
                        deviceId: device ? device.id : '',
                        deviceName: device ? device.getValue('name') : '',
                    };
                }),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

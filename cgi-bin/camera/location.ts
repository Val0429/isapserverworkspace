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
type InputR = IRequest.IDataList;

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

            let query: Parse.Query<IDB.Camera> = new Parse.Query(IDB.Camera);

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

            let devices: IDB.LocationDevice[] = await new Parse.Query(IDB.LocationDevice)
                .containedIn('camera', cameras)
                .equalTo('isDeleted', false)
                .include(['floor', 'area'])
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
                    let device: IDB.LocationDevice = devices[index];

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

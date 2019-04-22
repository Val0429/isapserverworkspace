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

            let query: Parse.Query<IDB.LocationDevice> = new Parse.Query(IDB.LocationDevice).equalTo('isDeleted', false);

            if (_input.floorId) {
                let floor: IDB.LocationFloor = new IDB.LocationFloor();
                floor.id = _input.floorId;

                query = query.equalTo('floor', floor);
            }
            if (_input.areaId) {
                let area: IDB.LocationArea = new IDB.LocationArea();
                area.id = _input.areaId;

                query = query.equalTo('area', area);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _pageSize);

            let devices: IDB.LocationDevice[] = await query
                .skip((_page - 1) * _pageSize)
                .limit(_pageSize)
                .include(['floor', 'area', 'camera'])
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
                        objectId: value.getValue('camera').id,
                        name: value.getValue('camera').getValue('name'),
                        floorId: value.getValue('floor').id,
                        floorName: value.getValue('floor').getValue('name'),
                        floorNo: value.getValue('floor').getValue('floorNo'),
                        areaId: value.getValue('area').id,
                        areaName: value.getValue('area').getValue('name'),
                        deviceId: value.id,
                        deviceName: value.getValue('name'),
                    };
                }),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

import { IUser, Action, Restful, RoleList, Errors, Socket, IBase } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Utility } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IReport.IDemographicIndex;

type OutputR = IResponse.IDataList<IResponse.IReport.IDemographicIndex>;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
        permission: [RoleList.SuperAdministrator],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            Object.keys(_input).forEach((value, index, array) => {
                if (_input[value] === 'undefined') {
                    delete _input[value];
                }
            });

            let deivceQuery: Parse.Query<IDB.Device> = new Parse.Query(IDB.Device);

            if ('siteId' in _input) {
                let site: IDB.LocationSite = await new Parse.Query(IDB.LocationSite)
                    .equalTo('objectId', _input.siteId)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!site) {
                    throw Errors.throw(Errors.CustomBadRequest, ['site not found']);
                }

                deivceQuery.equalTo('site', site);
            }
            if ('areaId' in _input) {
                let area: IDB.LocationArea = await new Parse.Query(IDB.LocationArea)
                    .equalTo('objectId', _input.areaId)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!area) {
                    throw Errors.throw(Errors.CustomBadRequest, ['area not found']);
                }

                deivceQuery.equalTo('area', area);
            }
            if ('deviceGroupId' in _input) {
                let group: IDB.DeviceGroup = await new Parse.Query(IDB.DeviceGroup)
                    .equalTo('objectId', _input.deviceGroupId)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!group) {
                    throw Errors.throw(Errors.CustomBadRequest, ['device group not found']);
                }

                deivceQuery.containedIn('groups', [group]);
            }
            if ('deviceId' in _input) {
                deivceQuery.equalTo('objectId', _input.deviceId);
            }

            let deviceCount: number = await deivceQuery.count().fail((e) => {
                throw e;
            });

            let devices: IDB.Device[] = await deivceQuery
                .limit(deviceCount)
                .include(['site', 'area', 'groups'])
                .find()
                .fail((e) => {
                    throw e;
                });

            let deviceIdDictionary: IBase.IObject.IKeyValue<IDB.Device> = {};
            devices.forEach((value, index, array) => {
                let key: string = value.id;

                deviceIdDictionary[key] = value;
            });

            let query: Parse.Query<IDB.ReportDemographic> = new Parse.Query(IDB.ReportDemographic).containedIn('device', devices);

            if ('isEmployee' in _input) {
                query.equalTo('isEmployee', _input.isEmployee);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let reports: IDB.ReportDemographic[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
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
                results: reports.map((value, index, array) => {
                    let device: IDB.Device = deviceIdDictionary[value.getValue('device').id];

                    let _device: IResponse.IObject = {
                        objectId: device.id,
                        name: device.getValue('name'),
                    };

                    let _site: IResponse.IObject = {
                        objectId: device.getValue('site').id,
                        name: device.getValue('site').getValue('name'),
                    };

                    let _area: IResponse.IObject = {
                        objectId: device.getValue('area').id,
                        name: device.getValue('area').getValue('name'),
                    };

                    let _deviceGroups: IResponse.IObject[] = (device.getValue('groups') || []).map((value1, index1, array1) => {
                        return {
                            objectId: value1.id,
                            name: value1.getValue('name'),
                        };
                    });

                    return {
                        site: _site,
                        area: _area,
                        deviceGroups: _deviceGroups,
                        device: _device,
                        date: value.getValue('date'),
                        imageSrc: value.getValue('imageSrc'),
                        isEmployee: value.getValue('isEmployee'),
                        age: value.getValue('age'),
                        gender: Enum.EGender[value.getValue('gender')],
                    };
                }),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

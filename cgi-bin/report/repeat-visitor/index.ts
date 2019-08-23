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
type InputR = IRequest.IDataList & IRequest.IReport.IRepeatVisitorIndex;

type OutputR = IResponse.IDataList<IResponse.IReport.IRepeatVisitorIndex>;

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

            if ('siteIds' in _input) {
                let siteIds: string[] = [].concat(data.parameters.siteIds);

                let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
                    .containedIn('objectId', siteIds)
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                deivceQuery.containedIn('site', sites);
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

            let query: Parse.Query<IDB.ReportRepeatVisitor> = new Parse.Query(IDB.ReportRepeatVisitor).containedIn('device', devices);

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let reports: IDB.ReportRepeatVisitor[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            let reportFaceIdDictionary: IBase.IObject.IKeyValue<IDB.ReportRepeatVisitor[]> = {};
            reports.forEach((value, index, array) => {
                let key: string = value.getValue('faceId');

                if (!reportFaceIdDictionary[key]) {
                    reportFaceIdDictionary[key] = [];
                }

                reportFaceIdDictionary[key].push(value);
            });

            let skip: number = (_paging.page - 1) * _paging.pageSize;

            let summarys: IResponse.IReport.IRepeatVisitorIndex[] = [];
            Object.keys(reportFaceIdDictionary).forEach((value, index, array) => {
                let faceIds = reportFaceIdDictionary[value];

                if (skip <= index && index < skip + _paging.pageSize) {
                    return;
                }

                let summary: IResponse.IReport.IRepeatVisitorIndex = {
                    faceId: value,
                    count: faceIds.length > 5 ? '5+' : faceIds.length.toString(),
                    datas: faceIds.map((value1, index1, array1) => {
                        let device: IDB.Device = deviceIdDictionary[value1.getValue('device').id];

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

                        let _deviceGroups: IResponse.IObject[] = (device.getValue('groups') || []).map((value2, index2, array2) => {
                            return {
                                objectId: value2.id,
                                name: value2.getValue('name'),
                            };
                        });

                        return {
                            site: _site,
                            area: _area,
                            deviceGroups: _deviceGroups,
                            device: _device,
                            date: value1.getValue('date'),
                            imageSrc: value1.getValue('imageSrc'),
                        };
                    }),
                };

                summarys.push(summary);
            });

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _paging.page,
                    pageSize: _paging.pageSize,
                },
                results: summarys,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

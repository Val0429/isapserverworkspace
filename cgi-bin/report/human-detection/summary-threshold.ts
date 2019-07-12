import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Utility } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { Report } from '../';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin, RoleList.User],
});

export default action;

const mediumThreshold: number = 10;
const highThreshold: number = 20;

/**
 * Action Create
 */
type InputC = IRequest.IReport.IHumanDetectionThreshold;

type OutputC = IResponse.IReport.IHumanDetectionThreshold[];

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let _area: IDB.LocationArea = await new Parse.Query(IDB.LocationArea)
                .equalTo('objectId', _input.areaId)
                .include('site')
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!_area) {
                throw Errors.throw(Errors.CustomBadRequest, ['area not found']);
            }

            let officeHours: IDB.OfficeHour[] = await new Parse.Query(IDB.OfficeHour)
                .containedIn('sites', [_area.getValue('site')])
                .find()
                .fail((e) => {
                    throw e;
                });

            let reports: IDB.ReportHumanDetection[] = await new Parse.Query(IDB.ReportHumanDetection)
                .equalTo('area', _area)
                .greaterThanOrEqualTo('date', _input.startDate)
                .lessThan('date', _input.endDate)
                .find()
                .fail((e) => {
                    throw e;
                });

            reports = reports.filter((value, index, array) => {
                let date: Date = value.getValue('date');
                let day: number = date.getDay();
                let hour: number = new Date(date).setFullYear(2000, 0, 1);

                return !!officeHours.find((value1, index1, array1) => {
                    return !!value1.getValue('dayRanges').find((value2, index2, array2) => {
                        let startDay: number = parseInt(value2.startDay);
                        let endDay: number = value2.endDay === '0' ? 7 : parseInt(value2.endDay);
                        let startDate: number = value2.startDate.getTime();
                        let endDate: number = value2.endDate.getTime();

                        return startDay <= day && day <= endDay && startDate <= hour && hour < endDate;
                    });
                });
            });

            let reportsDateDictionary: object = {};
            reports.forEach((value1, index1, array1) => {
                let key: string = value1.getValue('date').toISOString();

                if (!reportsDateDictionary[key]) {
                    reportsDateDictionary[key] = [];
                }

                reportsDateDictionary[key].push(value1);
            });

            let thresholds: IResponse.IReport.IHumanDetectionThreshold[] = [];
            Object.keys(reportsDateDictionary).forEach((value1, index1, array1) => {
                let dates = reportsDateDictionary[value1];

                let threshold: IResponse.IReport.IHumanDetectionThreshold = undefined;

                dates.forEach((value2, index2, array2) => {
                    if (index2 === 0) {
                        let site: IResponse.IObject = {
                            objectId: _area.getValue('site').id,
                            name: _area.getValue('site').getValue('name'),
                        };

                        let area: IResponse.IObject = {
                            objectId: _area.id,
                            name: _area.getValue('name'),
                        };

                        threshold = {
                            site: site,
                            area: area,
                            date: value2.getValue('date'),
                            total: 0,
                            imageSrcs: [],
                        };
                    }

                    threshold.total += value2.getValue('value');
                    threshold.imageSrcs.push(value2.getValue('imageSrc'));
                });

                thresholds.push(threshold);
            });

            let mediumCount: number = mediumThreshold;
            let highCount: number = highThreshold;

            let thresholdsLevelDictionary: object = {};
            thresholds.forEach((value1, index1, array1) => {
                let key: string = 'low';
                if (value1.total > mediumCount && value1.total <= highCount) {
                    key = 'medium';
                } else if (value1.total > highCount) {
                    key = 'high';
                }

                if (!thresholdsLevelDictionary[key]) {
                    thresholdsLevelDictionary[key] = [];
                }

                thresholdsLevelDictionary[key].push(value1);
            });

            return thresholdsLevelDictionary[_input.type] || [];
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

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

            let area: IDB.LocationArea = new IDB.LocationArea();
            area.id = _input.areaId;

            let reports: IDB.ReportHumanDetection[] = await new Parse.Query(IDB.ReportHumanDetection)
                .equalTo('area', area)
                .greaterThanOrEqualTo('date', _input.startDate)
                .lessThan('date', _input.endDate)
                .ascending(['date'])
                .include(['site', 'area'])
                .find()
                .fail((e) => {
                    throw e;
                });

            let thresholds = reports.reduce<IResponse.IReport.IHumanDetectionThreshold[]>((prev, curr, index, array) => {
                let threshold = prev.find((value1, index1, array1) => {
                    return value1.area.objectId === curr.getValue('area').id && value1.date.getTime() === curr.getValue('date').getTime();
                });
                if (threshold) {
                    threshold.total += curr.getValue('value');
                    threshold.imageSrcs.push(curr.getValue('imageSrc'));
                } else {
                    let site: IResponse.IObject = {
                        objectId: curr.getValue('site').id,
                        name: curr.getValue('site').getValue('name'),
                    };

                    let area: IResponse.IObject = {
                        objectId: curr.getValue('area').id,
                        name: curr.getValue('area').getValue('name'),
                    };

                    prev.push({
                        site: site,
                        area: area,
                        date: curr.getValue('date'),
                        total: curr.getValue('value'),
                        imageSrcs: [curr.getValue('imageSrc')],
                    });
                }

                return prev;
            }, []);

            if (_input.type === 'medium') {
                thresholds = thresholds.filter((value, index, array) => {
                    return value.total > mediumThreshold && value.total <= highThreshold;
                });
            } else if (_input.type === 'high') {
                thresholds = thresholds.filter((value, index, array) => {
                    return value.total > highThreshold;
                });
            }

            return thresholds;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

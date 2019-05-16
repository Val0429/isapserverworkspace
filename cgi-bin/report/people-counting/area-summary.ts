import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { GrandTotalSummarys } from './floor-summary';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IReport.IPeopleCountingAreaSummary;

type OutputR = IResponse.IReport.IPeopleCountingSummarys;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _startDate: Date = _input.startDate;
            let _endDate: Date = _input.endDate;
            let _areaIds: string[] = [].concat(data.parameters.areaIds);

            _areaIds = _areaIds.filter((value, index, array) => {
                return array.indexOf(value) === index;
            });

            let areas: IDB.LocationArea[] = _areaIds.map((value, index, array) => {
                let area: IDB.LocationArea = new IDB.LocationArea();
                area.id = value;

                return area;
            });

            _startDate = new Date(new Date(_startDate).setHours(0, 0, 0, 0));
            _endDate = new Date(new Date(new Date(_endDate).setDate(_endDate.getDate() + 1)).setHours(0, 0, 0, 0));

            let reportPCSummaryQuery: Parse.Query<IDB.ReportPeopleCountingSummary> = new Parse.Query(IDB.ReportPeopleCountingSummary)
                .equalTo('type', _input.dataRangeType)
                .containedIn('area', areas)
                .greaterThanOrEqualTo('date', _startDate)
                .lessThan('date', _endDate);

            let reportPCSummaryTotal: number = await reportPCSummaryQuery.count().fail((e) => {
                throw e;
            });

            let reportPCSummarys: IDB.ReportPeopleCountingSummary[] = await reportPCSummaryQuery
                .limit(reportPCSummaryTotal)
                .ascending(['date'])
                .include(['floor', 'area'])
                .find()
                .fail((e) => {
                    throw e;
                });

            reportPCSummarys = reportPCSummarys.filter((value, index, array) => {
                return !value.getValue('floor').getValue('isDeleted') && !value.getValue('area').getValue('isDeleted');
            });

            let summarys: IResponse.IReport.IPeopleCountingSummary[] = reportPCSummarys.reduce<IResponse.IReport.IPeopleCountingSummary[]>((prev, curr, value, index) => {
                let summary = prev.find((value1, index1, array1) => {
                    return value1.areaId === curr.getValue('area').id && value1.date.getTime() === curr.getValue('date').getTime();
                });
                if (summary) {
                    summary.in += curr.getValue('in');
                    summary.out += curr.getValue('out');
                    summary.inGrandTotal = summary.in;
                    summary.outGrandTotal = summary.out;
                } else {
                    prev.push({
                        objectId: curr.id,
                        floorId: curr.getValue('floor').id,
                        floorName: curr.getValue('floor').getValue('name'),
                        areaId: curr.getValue('area').id,
                        areaName: curr.getValue('area').getValue('name'),
                        type: Enum.ESummaryType[curr.getValue('type')],
                        date: curr.getValue('date'),
                        in: curr.getValue('in'),
                        out: curr.getValue('out'),
                        inGrandTotal: curr.getValue('in'),
                        outGrandTotal: curr.getValue('out'),
                    });
                }

                return prev;
            }, []);

            return {
                summarys: GrandTotalSummarys(_input.dataRangeType, summarys),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

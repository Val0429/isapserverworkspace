import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IReport.IHumanDetectionSummaryR;

type OutputR = IResponse.IReport.IHumanDetectionSummaryR;

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
            let _floorIds: string[] = [].concat(data.parameters.floorIds);

            _floorIds = _floorIds.filter((value, index, array) => {
                return array.indexOf(value) === index;
            });

            let floors: IDB.LocationFloor[] = _floorIds.map((value, index, array) => {
                let floor: IDB.LocationFloor = new IDB.LocationFloor();
                floor.id = value;

                return floor;
            });

            _startDate = new Date(new Date(_startDate).setHours(0, 0, 0, 0));
            _endDate = new Date(new Date(new Date(_endDate).setDate(_endDate.getDate() + 1)).setHours(0, 0, 0, 0));

            let reportHDSummaryQuery: Parse.Query<IDB.ReportHumanDetectionSummary> = new Parse.Query(IDB.ReportHumanDetectionSummary)
                .equalTo('type', _input.dataRangeType)
                .containedIn('floor', floors)
                .greaterThanOrEqualTo('date', _startDate)
                .lessThan('date', _endDate);

            let reportHDSummaryTotal: number = await reportHDSummaryQuery.count().fail((e) => {
                throw e;
            });

            let reportHDSummarys: IDB.ReportHumanDetectionSummary[] = await reportHDSummaryQuery
                .limit(reportHDSummaryTotal)
                .descending(['date'])
                .include(['floor', 'area', 'max'])
                .find()
                .fail((e) => {
                    throw e;
                });

            reportHDSummarys = reportHDSummarys.filter((value, index, array) => {
                return !value.getValue('floor').getValue('isDeleted') && !value.getValue('area').getValue('isDeleted');
            });

            let summarys: IResponse.IReport.IHumanDetectionSummary[] = reportHDSummarys.reduce<IResponse.IReport.IHumanDetectionSummary[]>((prev, curr, value, index) => {
                let summary = prev.find((value1, index1, array1) => {
                    return value1.areaId === curr.getValue('area').id && value1.date.getTime() === curr.getValue('date').getTime();
                });
                if (summary) {
                    let total: number = summary.total + curr.getValue('total');
                    let count: number = summary.count + curr.getValue('count');
                    let average: number = total / count || 0;

                    summary.total = total;
                    summary.count = count;
                    summary.average = Math.round(average);
                    if (summary.maxValue < curr.getValue('max').getValue('value')) {
                        summary.maxId = curr.getValue('max').id;
                        summary.maxValue = curr.getValue('max').getValue('value');
                    }
                } else {
                    let total: number = curr.getValue('total');
                    let count: number = curr.getValue('count');
                    let average: number = total / count || 0;

                    prev.push({
                        objectId: curr.id,
                        floorId: curr.getValue('floor').id,
                        floorName: curr.getValue('floor').getValue('name'),
                        areaId: curr.getValue('area').id,
                        areaName: curr.getValue('area').getValue('name'),
                        type: Enum.ESummaryType[curr.getValue('type')],
                        date: curr.getValue('date'),
                        total: total,
                        count: count,
                        average: Math.round(average),
                        maxId: curr.getValue('max').id,
                        maxValue: curr.getValue('max').getValue('value'),
                        mediumThresholdCount: 0,
                        mediumThresholds: [],
                        highThresholdCount: 0,
                        highThresholds: [],
                    });
                }

                return prev;
            }, []);

            summarys = await Promise.all(
                summarys.map(async (value, index, array) => {
                    let area: IDB.LocationArea = reportHDSummarys
                        .find((value1, index1, array1) => {
                            return value1.getValue('area').id === value.areaId;
                        })
                        .getValue('area');

                    let action: IDB.IActionSgsms[] = area.getValue('action').sgsms;
                    if (!action) {
                        return value;
                    }
                    action = action.sort((a, b) => {
                        return a.triggerCount > b.triggerCount ? -1 : 1;
                    });

                    let mediumCount: number = action.length >= 2 ? action[1].triggerCount : action[0].triggerCount;
                    let highCount: number = action[0].triggerCount;

                    let startDate: Date = new Date(value.date);
                    let endDate: Date = new Date(value.date);
                    switch (_input.dataRangeType) {
                        case Enum.ESummaryType.hour:
                            endDate = new Date(endDate.setHours(endDate.getHours() + 1));
                            break;
                        case Enum.ESummaryType.day:
                            endDate = new Date(endDate.setDate(endDate.getDate() + 1));
                            break;
                        case Enum.ESummaryType.month:
                            endDate = new Date(endDate.setMonth(endDate.getMonth() + 1));
                            break;
                    }

                    let reportHDs: IDB.ReportHumanDetection[] = await new Parse.Query(IDB.ReportHumanDetection)
                        .equalTo('area', area)
                        .greaterThanOrEqualTo('date', startDate)
                        .lessThan('date', endDate)
                        .descending(['date'])
                        .find()
                        .fail((e) => {
                            throw e;
                        });

                    let thresholds: IResponse.IReport.IHumanDetection[] = reportHDs.reduce<IResponse.IReport.IHumanDetection[]>((prev, curr, index, array) => {
                        let threshold = prev.find((value1, index1, array1) => {
                            return value1.date.getTime() === curr.getValue('date').getTime();
                        });
                        if (threshold) {
                            threshold.imageSrcs.push(curr.getValue('imageSrc'));
                            threshold.total += curr.getValue('value');
                        } else {
                            prev.push({
                                date: curr.getValue('date'),
                                imageSrcs: [curr.getValue('imageSrc')],
                                total: curr.getValue('value'),
                            });
                        }

                        return prev;
                    }, []);

                    value.mediumThresholdCount = mediumCount;
                    value.mediumThresholds = thresholds.filter((value, index, array) => {
                        return value.total >= mediumCount && value.total < highCount;
                    });

                    value.highThresholdCount = highCount;
                    value.highThresholds = thresholds.filter((value, index, array) => {
                        return value.total >= highCount;
                    });

                    return value;
                }),
            ).catch((e) => {
                throw e;
            });

            return {
                summarys: summarys,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

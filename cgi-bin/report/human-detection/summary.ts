import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Utility } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { ReportSummary } from '../';

let action = new Action({
    loginRequired: true,
});

export default action;

const mediumThreshold: number = 10;
const highThreshold: number = 20;

/**
 * Action Create
 */
type InputC = IRequest.IReport.IHumanDetectionSummary;

type OutputC = IResponse.IReport.IHumanDetectionSummary;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new ReportHumanDetection();
            report.mode = Enum.EDeviceMode.humanDetection;

            await report.Initialization(_input, _userInfo.siteIds);

            let weathers = report.summaryWeathers;

            let officeHours = report.summaryOfficeHours;

            let summaryChartDatas = report.GetSummaryChartDatas();

            let summaryTableDatas = await report.GetSummaryTableDatas();

            report.Dispose();
            report = null;

            return {
                weathers: weathers,
                officeHours: officeHours,
                summaryChartDatas: summaryChartDatas,
                summaryTableDatas: summaryTableDatas,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

export class ReportHumanDetection extends ReportSummary {
    /**
     *
     */
    private _currReports: IDB.ReportHumanDetectionSummary[] = [];

    /**
     *
     */
    private _prevReports: IDB.ReportHumanDetectionSummary[] = [];

    /**
     * Initialization
     * @param input
     * @param userSiteIds
     */
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[]): Promise<void> {
        try {
            await super.Initialization(input, userSiteIds);

            let tasks = [];

            tasks.push(
                (async () => {
                    this._currReports = await this.GetReports(IDB.ReportHumanDetectionSummary, ['max']);
                })(),
            );
            tasks.push(
                (async () => {
                    this._prevReports = await this.GetReports(IDB.ReportHumanDetectionSummary, ['max'], this.prevDateRange.startDate, this.prevDateRange.endDate);
                })(),
            );

            await Promise.all(tasks);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Dispose
     */
    public Dispose() {
        try {
            this._currReports.length = 0;
            this._prevReports.length = 0;

            super.Dispose();
        } catch (e) {
            throw e;
        }
    }

    /**
     * Summary chart datas
     * @param reports
     */
    public SummaryChartDatas(reports: IDB.ReportHumanDetectionSummary[]): IResponse.IReport.IHumanDetectionSummaryChartData[] {
        try {
            let reportsDateDeviceDictionary: object = {};
            reports.forEach((value, index, array) => {
                let key: string = this.GetTypeDate(value.getValue('date')).toISOString();
                let key1: string = value.getValue('device').id;

                if (!reportsDateDeviceDictionary[key]) {
                    reportsDateDeviceDictionary[key] = {};
                }
                if (!reportsDateDeviceDictionary[key][key1]) {
                    reportsDateDeviceDictionary[key][key1] = [];
                }

                reportsDateDeviceDictionary[key][key1].push(value);
            });

            let summarys: IResponse.IReport.IHumanDetectionSummaryChartData[] = [];
            Object.keys(reportsDateDeviceDictionary).forEach((value, index, array) => {
                let date = reportsDateDeviceDictionary[value];

                Object.keys(date).forEach((value1, index1, array1) => {
                    let devices = date[value1];

                    let summary: IResponse.IReport.IHumanDetectionSummaryChartData = undefined;

                    devices.forEach((value2, index2, array2) => {
                        if (index2 === 0) {
                            let base = this.GetBaseSummaryData(value2);

                            summary = {
                                ...base,
                                total: 0,
                                count: 0,
                            };
                        }

                        summary.total += value2.getValue('total');
                        summary.count += value2.getValue('count');
                    });

                    summarys.push(summary);
                });
            });

            reportsDateDeviceDictionary = null;

            return summarys;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Summary table datas
     * @param reports
     */
    public async SummaryTableDatas(reports: IDB.ReportHumanDetectionSummary[]): Promise<IResponse.IReport.IHumanDetectionSummaryTableData[]> {
        try {
            let reportsDateAreaDictionary: object = {};
            let reportsAreaDictionary: object = {};
            reports.forEach((value, index, array) => {
                let key: string = this.GetTypeDate(value.getValue('date')).toISOString();
                let key1: string = value.getValue('area').id;

                if (!reportsDateAreaDictionary[key]) {
                    reportsDateAreaDictionary[key] = {};
                }
                if (!reportsDateAreaDictionary[key][key1]) {
                    reportsDateAreaDictionary[key][key1] = [];
                }

                reportsDateAreaDictionary[key][key1].push(value);

                if (!reportsAreaDictionary[key1]) {
                    reportsAreaDictionary[key1] = [];
                }

                if (reportsAreaDictionary[key1].indexOf(value.getValue('device').id) === -1) {
                    reportsAreaDictionary[key1].push(value.getValue('device').id);
                }
            });

            let summarys: IResponse.IReport.IHumanDetectionSummaryTableData[] = [];
            Object.keys(reportsDateAreaDictionary).forEach((value, index, array) => {
                let date = reportsDateAreaDictionary[value];

                Object.keys(date).forEach((value1, index1, array1) => {
                    let areas = date[value1];

                    let summary: IResponse.IReport.IHumanDetectionSummaryTableData = undefined;

                    areas.forEach((value2, index2, array2) => {
                        if (index2 === 0) {
                            let base = this.GetBaseSummaryData(value2);

                            summary = {
                                site: base.site,
                                area: base.area,
                                date: base.date,
                                type: base.type,
                                total: 0,
                                count: 0,
                                maxValue: undefined,
                            };
                        }

                        summary.total += value2.getValue('total');
                        summary.count += value2.getValue('count');
                        summary.maxValue = summary.maxValue && summary.maxValue > value2.getValue('max').getValue('value') ? summary.maxValue : value2.getValue('max').getValue('value');
                    });

                    summary.total *= (reportsAreaDictionary[summary.area.objectId] || []).length;

                    summarys.push(summary);
                });
            });

            reportsDateAreaDictionary = null;
            reportsAreaDictionary = null;

            summarys = await Promise.all(
                summarys.map(async (value, index, array) => {
                    let area: IDB.LocationArea = new IDB.LocationArea();
                    area.id = value.area.objectId;

                    let mediumCount: number = mediumThreshold;
                    let highCount: number = highThreshold;

                    let startDate: Date = new Date(value.date);
                    let endDate: Date = new Date(value.date);
                    switch (this.type) {
                        case Enum.ESummaryType.hour:
                            endDate = new Date(endDate.setHours(endDate.getHours() + 1));
                            break;
                        case Enum.ESummaryType.day:
                            endDate = new Date(endDate.setDate(endDate.getDate() + 1));
                            break;
                        case Enum.ESummaryType.month:
                            endDate = new Date(endDate.setMonth(endDate.getMonth() + 1));
                            break;
                        case Enum.ESummaryType.season:
                            endDate = new Date(endDate.setMonth(endDate.getMonth() + 3));
                            break;
                    }

                    let reports: IDB.ReportHumanDetection[] = await new Parse.Query(IDB.ReportHumanDetection)
                        .equalTo('area', area)
                        .greaterThanOrEqualTo('date', startDate)
                        .lessThan('date', endDate)
                        .ascending(['date'])
                        .find()
                        .fail((e) => {
                            throw e;
                        });

                    let reportsDateDictionary: object = {};
                    reports.forEach((value1, index1, array1) => {
                        let key: string = value1.getValue('date').toISOString();

                        if (!reportsDateDictionary[key]) {
                            reportsDateDictionary[key] = [];
                        }

                        reportsDateDictionary[key].push(value1);
                    });

                    reports.length = 0;

                    let thresholds: { date: Date; total: number }[] = [];
                    Object.keys(reportsDateDictionary).forEach((value1, index1, array1) => {
                        let dates = reportsDateDictionary[value1];

                        let threshold: { date: Date; total: number } = undefined;

                        dates.forEach((value2, index2, array2) => {
                            if (index2 === 0) {
                                threshold = {
                                    date: value2.getValue('date'),
                                    total: 0,
                                };
                            }

                            threshold.total += value2.getValue('value');
                        });

                        thresholds.push(threshold);
                    });

                    reportsDateDictionary = null;

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

                    thresholds.length = 0;

                    value.mediumThreshold = mediumCount;
                    value.mediumThresholdCount = (thresholdsLevelDictionary['medium'] || []).length;

                    value.highThreshold = highCount;
                    value.highThresholdCount = (thresholdsLevelDictionary['high'] || []).length;

                    thresholdsLevelDictionary = null;

                    return value;
                }),
            ).catch((e) => {
                throw e;
            });

            return summarys;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get chart summary
     */
    public GetSummaryChartDatas(): IResponse.IReport.IHumanDetectionSummaryChartData[] {
        try {
            let currSummarys = this.SummaryChartDatas(this._currReports);

            // let prevSummarys = this.SummaryChartDatas(this._prevReports);

            return currSummarys;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get table summary
     */
    public async GetSummaryTableDatas(): Promise<IResponse.IReport.IHumanDetectionSummaryTableData[]> {
        try {
            let tasks = [];

            let currSummarys: IResponse.IReport.IHumanDetectionSummaryTableData[] = [];
            tasks.push(
                (async () => {
                    currSummarys = await this.SummaryTableDatas(this._currReports);
                })(),
            );

            let prevSummarys: IResponse.IReport.IHumanDetectionSummaryTableData[] = [];
            tasks.push(
                (async () => {
                    prevSummarys = await this.SummaryTableDatas(this._prevReports);
                })(),
            );

            await Promise.all(tasks);

            let summarys = currSummarys.map<IResponse.IReport.IHumanDetectionSummaryTableData>((value, index, array) => {
                let prevSummary = prevSummarys.find((value1, index1, array1) => {
                    return value1.area.objectId === value.area.objectId && value1.date.getTime() === value.date.getTime() - this.dateGap;
                });

                let prevTotal: number = prevSummary ? prevSummary.total : NaN;
                let prevCount: number = prevSummary ? prevSummary.count : NaN;

                return {
                    site: value.site,
                    area: value.area,
                    date: value.date,
                    type: value.type,
                    total: value.total,
                    prevTotal: prevTotal,
                    count: value.count,
                    prevCount: prevCount,
                    maxValue: value.maxValue,
                    mediumThreshold: value.mediumThreshold,
                    mediumThresholdCount: value.mediumThresholdCount,
                    highThreshold: value.highThreshold,
                    highThresholdCount: value.highThresholdCount,
                };
            }, []);

            currSummarys.length = 0;
            prevSummarys.length = 0;

            return summarys;
        } catch (e) {
            throw e;
        }
    }
}

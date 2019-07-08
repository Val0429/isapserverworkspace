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
type InputC = IRequest.IReport.IHumanDetectionSummary;

type OutputC = IResponse.IReport.IHumanDetectionSummary;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new ReportHumanDetection();

            await report.Initialization(_input, _userInfo.siteIds);

            let summaryChartDatas = report.GetSummaryChartDatas();

            let summaryTableDatas = await report.GetSummaryTableDatas();

            return {
                weathers: report.weathers,
                officeHours: report.officeHours,
                summaryChartDatas: summaryChartDatas,
                summaryTableDatas: summaryTableDatas,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

export class ReportHumanDetection extends Report {
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
     * Summary chart datas
     * @param reports
     */
    public SummaryChartDatas(reports: IDB.ReportHumanDetectionSummary[]): IResponse.IReport.IHumanDetectionSummaryChartData[] {
        try {
            let summarys = reports.reduce<IResponse.IReport.IHumanDetectionSummaryChartData[]>((prev, curr, index, array) => {
                let date: Date = this.GetTypeDate(curr.getValue('date'));

                let summary = prev.find((value1, index1, array1) => {
                    return value1.device.objectId === curr.getValue('device').id && value1.date.getTime() === date.getTime();
                });
                if (summary) {
                    summary.total += curr.getValue('total');
                    summary.count += curr.getValue('count');
                } else {
                    let base = this.GetBaseSummaryData(curr);

                    prev.push({
                        ...base,
                        total: curr.getValue('total'),
                        count: curr.getValue('count'),
                    });
                }

                return prev;
            }, []);

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
            let summarys = reports.reduce<IResponse.IReport.IHumanDetectionSummaryTableData[]>((prev, curr, index, array) => {
                let date: Date = this.GetTypeDate(curr.getValue('date'));

                let summary = prev.find((value1, index1, array1) => {
                    return value1.area.objectId === curr.getValue('area').id && value1.date.getTime() === date.getTime();
                });
                if (summary) {
                    summary.total += curr.getValue('total');
                    summary.count += curr.getValue('count');
                    summary.maxValue = summary.maxValue > curr.getValue('max').getValue('value') ? summary.maxValue : curr.getValue('max').getValue('value');
                } else {
                    let base = this.GetBaseSummaryData(curr);

                    prev.push({
                        site: base.site,
                        area: base.area,
                        date: base.date,
                        type: base.type,
                        total: curr.getValue('total'),
                        count: curr.getValue('count'),
                        maxValue: curr.getValue('max').getValue('value'),
                    });
                }

                return prev;
            }, []);

            summarys = await Promise.all(
                summarys.map(async (value, index, array) => {
                    let area: IDB.LocationArea = new IDB.LocationArea();
                    area.id = value.area.objectId;

                    let mediumCount: number = mediumThreshold;
                    let highCount: number = highThreshold;

                    let startDate: Date = new Date(value.date);
                    let endDate: Date = new Date(value.date);
                    switch (this._type) {
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

                    let thresholds = reports.reduce<{ date: Date; total: number }[]>((prev1, curr1, index1, array1) => {
                        let threshold = prev1.find((value2, index2, array2) => {
                            return value2.date.getTime() === curr1.getValue('date').getTime();
                        });
                        if (threshold) {
                            threshold.total += curr1.getValue('value');
                        } else {
                            prev1.push({
                                date: curr1.getValue('date'),
                                total: curr1.getValue('value'),
                            });
                        }

                        return prev1;
                    }, []);

                    value.mediumThreshold = mediumCount;
                    value.mediumThresholdCount = thresholds.filter((value1, index1, array1) => {
                        return value1.total > mediumCount && value1.total <= highCount;
                    }).length;

                    value.highThreshold = highCount;
                    value.highThresholdCount = thresholds.filter((value1, index1, array1) => {
                        return value1.total > highCount;
                    }).length;

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

            return summarys;
        } catch (e) {
            throw e;
        }
    }
}

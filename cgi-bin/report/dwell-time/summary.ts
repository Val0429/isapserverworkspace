import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
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

const timeRanges = Utility.Str2ValueRange(Config.deviceDwellTime.timeRange);
const ageRanges = Utility.Str2ValueRange(Config.deviceDemographic.ageRange);

/**
 * Action Create
 */
type InputC = IRequest.IReport.IDwellTimeSummary;

type OutputC = IResponse.IReport.IDwellTimeSummary;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new ReportDwellTime();
            report.mode = Enum.EDeviceMode.dwellTime;

            await report.Initialization(_input, _userInfo.siteIds);

            let weathers = report.summaryWeathers;

            let officeHours = report.summaryOfficeHours;

            let salesRecords = await report.GetSalesRecordSummarys();

            let summaryDatas = report.GetSummaryDatas();

            report.Dispose();
            report = null;

            return {
                weathers: weathers,
                officeHours: officeHours,
                salesRecords: salesRecords,
                summaryDatas: summaryDatas,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

export class ReportDwellTime extends ReportSummary {
    /**
     *
     */
    private _currReports: IDB.ReportDwellTimeSummary[] = [];

    /**
     *
     */
    private _prevReports: IDB.ReportDwellTimeSummary[] = [];

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
                    this._currReports = await this.GetReports(IDB.ReportDwellTimeSummary, []);
                })(),
            );
            tasks.push(
                (async () => {
                    this._prevReports = await this.GetReports(IDB.ReportDwellTimeSummary, [], this.prevDateRange.startDate, this.prevDateRange.endDate);
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
     * Summary table datas
     * @param reports
     */
    public SummaryDatas(reports: IDB.ReportDwellTimeSummary[]): IResponse.IReport.IDwellTimeSummaryData[] {
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

            let summarys: IResponse.IReport.IDwellTimeSummaryData[] = [];
            Object.keys(reportsDateDeviceDictionary).forEach((value, index, array) => {
                let date = reportsDateDeviceDictionary[value];

                Object.keys(date).forEach((value1, index1, array1) => {
                    let devices = date[value1];

                    let summary: IResponse.IReport.IDwellTimeSummaryData = undefined;

                    devices.forEach((value2, index2, array2) => {
                        if (index2 === 0) {
                            let base = this.GetBaseSummaryData(value2);

                            summary = {
                                ...base,
                                total: 0,
                                count: 0,
                                maleTotal: 0,
                                maleEmployeeTotal: 0,
                                femaleTotal: 0,
                                femaleEmployeeTotal: 0,
                                dwellTimeRanges: undefined,
                            };
                        }

                        let dwellTimeRanges = value2.getValue('dwellTimeRanges');

                        summary.total += value2.getValue('total');
                        summary.count += value2.getValue('count');
                        summary.maleTotal += Utility.Sum(dwellTimeRanges, 'maleTotal');
                        summary.maleEmployeeTotal += Utility.Sum(dwellTimeRanges, 'maleEmployeeTotal');
                        summary.femaleTotal += Utility.Sum(dwellTimeRanges, 'femaleTotal');
                        summary.femaleEmployeeTotal += Utility.Sum(dwellTimeRanges, 'femaleEmployeeTotal');

                        if (!summary.dwellTimeRanges) {
                            summary.dwellTimeRanges = dwellTimeRanges;
                        } else {
                            summary.dwellTimeRanges.forEach((value3, index3, array3) => {
                                let dwellTimeRange = dwellTimeRanges[index3];

                                value3.total += dwellTimeRange.total;
                                value3.maleTotal += dwellTimeRange.maleTotal;
                                value3.maleEmployeeTotal += dwellTimeRange.maleEmployeeTotal;
                                value3.maleRanges = Utility.MerageArray(value3.maleRanges, dwellTimeRange.maleRanges);
                                value3.maleEmployeeRanges = Utility.MerageArray(value3.maleEmployeeRanges, dwellTimeRange.maleEmployeeRanges);
                                value3.femaleTotal += dwellTimeRange.femaleTotal;
                                value3.femaleEmployeeTotal += dwellTimeRange.femaleEmployeeTotal;
                                value3.femaleRanges = Utility.MerageArray(value3.femaleRanges, dwellTimeRange.femaleRanges);
                                value3.femaleEmployeeRanges = Utility.MerageArray(value3.femaleEmployeeRanges, dwellTimeRange.femaleEmployeeRanges);
                            });
                        }
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
     * Get summary
     */
    public GetSummaryDatas(): IResponse.IReport.IDwellTimeSummaryData[] {
        try {
            let currSummarys = this.SummaryDatas(this._currReports);

            let prevSummarys = this.SummaryDatas(this._prevReports);

            let summarys = currSummarys.map<IResponse.IReport.IDwellTimeSummaryData>((value, index, array) => {
                let prevSummary = prevSummarys.find((value1, index1, array1) => {
                    return value1.device.objectId === value.device.objectId && value1.date.getTime() === value.date.getTime() - this.dateGap;
                });

                let prevTotal: number = prevSummary ? prevSummary.total : NaN;
                let prevCount: number = prevSummary ? prevSummary.count : NaN;

                return {
                    site: value.site,
                    area: value.area,
                    deviceGroups: value.deviceGroups,
                    device: value.device,
                    date: value.date,
                    type: value.type,
                    total: value.total,
                    prevTotal: prevTotal,
                    count: value.count,
                    prevCount: prevCount,
                    maleTotal: value.maleTotal,
                    maleEmployeeTotal: value.maleEmployeeTotal,
                    femaleTotal: value.femaleTotal,
                    femaleEmployeeTotal: value.femaleEmployeeTotal,
                    dwellTimeRanges: value.dwellTimeRanges,
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

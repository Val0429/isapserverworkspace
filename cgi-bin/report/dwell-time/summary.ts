import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Utility } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { Report } from '../';

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

            await report.Initialization(_input, _userInfo.siteIds);

            let weathers = report.summaryWeathers;

            let officeHours = report.summaryOfficeHours;

            let salesRecords = await report.GetSalesRecordSummarys();

            let summaryRangeDatas = await report.GetSummaryRangeDatas();

            let summaryTableDatas = report.GetSummaryTableDatas();

            report.Dispose();
            report = null;

            return {
                weathers: weathers,
                officeHours: officeHours,
                salesRecords: salesRecords,
                summaryRangeDatas: summaryRangeDatas,
                summaryTableDatas: summaryTableDatas,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

export class ReportDwellTime extends Report {
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
    public SummaryTableDatas(reports: IDB.ReportDwellTimeSummary[]): IResponse.IReport.IDwellTimeSummaryTableData[] {
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

            let summarys: IResponse.IReport.IDwellTimeSummaryTableData[] = [];
            Object.keys(reportsDateDeviceDictionary).forEach((value, index, array) => {
                let date = reportsDateDeviceDictionary[value];

                Object.keys(date).forEach((value1, index1, array1) => {
                    let devices = date[value1];

                    let summary: IResponse.IReport.IDwellTimeSummaryTableData = undefined;

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
     * Get summary
     */
    public async GetSummaryRangeDatas(): Promise<IResponse.IReport.IDwellTimeSummaryRangeData[]> {
        try {
            let currSummarys = await this.GetDwellTimeSummaryRangeDatas(this._currReports);

            return currSummarys;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get summary
     */
    public GetSummaryTableDatas(): IResponse.IReport.IDwellTimeSummaryTableData[] {
        try {
            let currSummarys = this.SummaryTableDatas(this._currReports);

            let prevSummarys = this.SummaryTableDatas(this._prevReports);

            let summarys = currSummarys.map<IResponse.IReport.IDwellTimeSummaryTableData>((value, index, array) => {
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

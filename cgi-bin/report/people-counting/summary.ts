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

/**
 * Action Create
 */
type InputC = IRequest.IReport.IPeopleCountingSummary;

type OutputC = IResponse.IReport.IPeopleCountingSummary;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new ReportPeopleCounting();

            await report.Initialization(_input, _userInfo.siteIds);

            let peakHours = report.GetPeakHours();

            let salesRecords = await report.GetSalesRecordSummarys();

            let summaryDatas = report.GetSummaryDatas();

            return {
                weathers: report.weathers,
                officeHours: report.officeHours,
                peakHours: peakHours,
                salesRecords: salesRecords,
                summaryDatas: summaryDatas,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

export class ReportPeopleCounting extends Report {
    /**
     *
     */
    private _currReports: IDB.ReportPeopleCountingSummary[] = [];

    /**
     *
     */
    private _prevReports: IDB.ReportPeopleCountingSummary[] = [];

    /**
     * Initialization
     * @param input
     * @param userSiteIds
     */
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[]): Promise<void> {
        try {
            await super.Initialization(input, userSiteIds);

            let tasks = [];

            tasks.push(this.GetReports(IDB.ReportPeopleCountingSummary));
            tasks.push(this.GetReports(IDB.ReportPeopleCountingSummary, this.prevDateRange.startDate, this.prevDateRange.endDate));

            let result = await Promise.all(tasks);

            this._currReports = result[0];
            this._prevReports = result[1];
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get peak hour
     */
    public GetPeakHours(): IResponse.IReport.IPeakHour[] {
        try {
            let peakHours = this._currReports.reduce<IResponse.IReport.IPeakHour[]>((prev, curr, index, array) => {
                let traffic: number = curr.getValue('in') - (curr.getValue('inEmployee') || 0);

                let data: IResponse.IReport.IPeakHourData = {
                    date: curr.getValue('date'),
                    level: traffic,
                };

                let peakHour = prev.find((value1, index1, array1) => {
                    return value1.date.getTime() === new Date(curr.getValue('date')).setHours(0, 0, 0, 0) && value1.site.objectId === curr.getValue('site').id;
                });
                if (peakHour) {
                    let peakHourData = peakHour.peakHourDatas.find((value1, index1, array1) => {
                        return value1.date.getTime() === curr.getValue('date').getTime();
                    });
                    if (peakHourData) {
                        peakHourData.level += traffic;
                    } else {
                        peakHour.peakHourDatas.push(data);
                    }
                } else {
                    prev.push({
                        site: {
                            objectId: curr.getValue('site').id,
                            name: curr.getValue('site').getValue('name'),
                        },
                        date: new Date(new Date(curr.getValue('date')).setHours(0, 0, 0, 0)),
                        peakHourDatas: [data],
                    });
                }

                return prev;
            }, []);

            let datas: number[] = [].concat(
                ...peakHours.map((value, index, array) => {
                    return value.peakHourDatas.map((value1, index1, array1) => {
                        return value1.level;
                    });
                }),
            );

            let levels: number[] = [Utility.Percentile(datas, 0), Utility.Percentile(datas, 0.2), Utility.Percentile(datas, 0.4), Utility.Percentile(datas, 0.6), Utility.Percentile(datas, 0.8), Utility.Percentile(datas, 1)];

            peakHours = peakHours.map((value, index, array) => {
                value.peakHourDatas = value.peakHourDatas.map((value1, index1, array1) => {
                    value1.level = levels.findIndex((value2, index2, array2) => {
                        return value2 >= value1.level;
                    });

                    return value1;
                });

                return value;
            });

            return peakHours;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Summary datas
     * @param reports
     */
    public SummaryDatas(reports: IDB.ReportPeopleCountingSummary[]): IResponse.IReport.IPeopleCountingSummaryData[] {
        try {
            let summarys = reports.reduce<IResponse.IReport.IPeopleCountingSummaryData[]>((prev, curr, index, array) => {
                let date: Date = this.GetTypeDate(curr.getValue('date'));

                let summary = prev.find((value1, index1, array1) => {
                    return value1.device.objectId === curr.getValue('device').id && value1.date.getTime() === date.getTime();
                });
                if (summary) {
                    summary.in += curr.getValue('in');
                    summary.out += curr.getValue('out');
                    summary.inEmployee += curr.getValue('inEmployee') || 0;
                    summary.outEmployee += curr.getValue('outEmployee') || 0;
                } else {
                    let base = this.GetBaseSummaryData(curr);

                    prev.push({
                        ...base,
                        in: curr.getValue('in'),
                        out: curr.getValue('out'),
                        inEmployee: curr.getValue('inEmployee') || 0,
                        outEmployee: curr.getValue('outEmployee') || 0,
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
     * Get summary
     */
    public GetSummaryDatas(): IResponse.IReport.IPeopleCountingSummaryData[] {
        try {
            let currSummarys = this.SummaryDatas(this._currReports);

            let prevSummarys = this.SummaryDatas(this._prevReports);

            let summarys = currSummarys.map<IResponse.IReport.IPeopleCountingSummaryData>((value, index, array) => {
                let prevSummary = prevSummarys.find((value1, index1, array1) => {
                    return value1.device.objectId === value.device.objectId && value1.date.getTime() === value.date.getTime() - this.dateGap;
                });

                // let inVariety: number = prevSummary && prevSummary.in !== 0 ? Utility.Round(value.in / prevSummary.in - 1, 2) : NaN;

                // let outVariety: number = prevSummary && prevSummary.out !== 0 ? Utility.Round(value.out / prevSummary.out - 1, 2) : NaN;

                let prevIn: number = prevSummary ? prevSummary.in : NaN;
                let prevOut: number = prevSummary ? prevSummary.out : NaN;

                let prevInEmployee: number = prevSummary ? prevSummary.inEmployee : NaN;
                let prevOutEmployee: number = prevSummary ? prevSummary.outEmployee : NaN;

                return {
                    site: value.site,
                    area: value.area,
                    deviceGroups: value.deviceGroups,
                    device: value.device,
                    date: value.date,
                    type: value.type,
                    in: value.in,
                    prevIn: prevIn,
                    out: value.out,
                    prevOut: prevOut,
                    inEmployee: value.inEmployee,
                    prevInEmployee: prevInEmployee,
                    outEmployee: value.outEmployee,
                    prevOutEmployee: prevOutEmployee,
                };
            }, []);

            return summarys;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get sales record
     */
    public async GetSalesRecordSummarys(): Promise<IResponse.IReport.ISalesRecordSummaryData[]> {
        try {
            let summarys = await super.GetSalesRecordSummarys(this._currReports);

            return summarys;
        } catch (e) {
            throw e;
        }
    }
}

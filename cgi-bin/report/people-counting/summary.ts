import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
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

/**
 * Action Create
 */
type InputC = IRequest.IReport.IPeopleCountingSummary;

type OutputC = IResponse.IReport.IPeopleCountingSummary;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new ReportPeopleCounting();

            await report.Initialization(_input, _userInfo.siteIds);

            let weathers = report.summaryWeathers;

            let officeHours = report.summaryOfficeHours;

            let peakHours = report.GetPeakHours();

            let salesRecords = await report.GetSalesRecordSummarys();

            let summaryDatas = report.GetSummaryDatas();

            report.Dispose();
            report = null;

            return {
                weathers: weathers,
                officeHours: officeHours,
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

            tasks.push(
                (async () => {
                    this._currReports = await this.GetReports(IDB.ReportPeopleCountingSummary, []);
                })(),
            );
            tasks.push(
                (async () => {
                    this._prevReports = await this.GetReports(IDB.ReportPeopleCountingSummary, [], this.prevDateRange.startDate, this.prevDateRange.endDate);
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
     * Get peak hour
     */
    public GetPeakHours(): IResponse.IReport.IPeakHour[] {
        try {
            let reportsSiteDateDateDictionary: object = {};
            this._currReports.forEach((value, index, array) => {
                let key: string = value.getValue('site').id;
                let key1: string = this.GetTypeDate(value.getValue('date'), Enum.ESummaryType.day).toISOString();
                let key2: string = value.getValue('date').toISOString();

                if (!reportsSiteDateDateDictionary[key]) {
                    reportsSiteDateDateDictionary[key] = {};
                }
                if (!reportsSiteDateDateDictionary[key][key1]) {
                    reportsSiteDateDateDictionary[key][key1] = {};
                }
                if (!reportsSiteDateDateDictionary[key][key1][key2]) {
                    reportsSiteDateDateDictionary[key][key1][key2] = [];
                }

                reportsSiteDateDateDictionary[key][key1][key2].push(value);
            });

            let peakHours: IResponse.IReport.IPeakHour[] = [];
            Object.keys(reportsSiteDateDateDictionary).forEach((value, index, array) => {
                let site = reportsSiteDateDateDictionary[value];

                Object.keys(site).forEach((value1, inedx1, array1) => {
                    let date = site[value1];

                    let peakHour: IResponse.IReport.IPeakHour = {
                        site: undefined,
                        date: new Date(value1),
                        peakHourDatas: [],
                    };

                    Object.keys(date).forEach((value2, index2, array2) => {
                        let dates = date[value2];

                        let peakHourData: IResponse.IReport.IPeakHourData = undefined;

                        dates.forEach((value3, index3, array3) => {
                            if (index3 === 0) {
                                peakHour.site = this.sitesIdDictionary[value3.getValue('site').id];

                                peakHourData = {
                                    date: value3.getValue('date'),
                                    level: 0,
                                };
                            }

                            peakHourData.level += value3.getValue('in') - value3.getValue('inEmployee');
                        });

                        peakHour.peakHourDatas.push(peakHourData);
                    });

                    peakHours.push(peakHour);
                });
            });

            reportsSiteDateDateDictionary = null;

            // let datas: number[] = [].concat(
            //     ...peakHours.map((value, index, array) => {
            //         return value.peakHourDatas.map((value1, index1, array1) => {
            //             return value1.level;
            //         });
            //     }),
            // );

            // let levels: number[] = [Utility.Percentile(datas, 0), Utility.Percentile(datas, 0.2), Utility.Percentile(datas, 0.4), Utility.Percentile(datas, 0.6), Utility.Percentile(datas, 0.8), Utility.Percentile(datas, 1)];

            // datas.length = 0;

            // peakHours = peakHours.map((value, index, array) => {
            //     value.peakHourDatas = value.peakHourDatas.map((value1, index1, array1) => {
            //         value1.level = levels.findIndex((value2, index2, array2) => {
            //             return value2 >= value1.level;
            //         });

            //         return value1;
            //     });

            //     return value;
            // });

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

            let summarys: IResponse.IReport.IPeopleCountingSummaryData[] = [];
            Object.keys(reportsDateDeviceDictionary).forEach((value, index, array) => {
                let date = reportsDateDeviceDictionary[value];

                Object.keys(date).forEach((value1, index1, array1) => {
                    let devices = date[value1];

                    let summary: IResponse.IReport.IPeopleCountingSummaryData = undefined;

                    devices.forEach((value2, index2, array2) => {
                        if (index2 === 0) {
                            let base = this.GetBaseSummaryData(value2);

                            summary = {
                                ...base,
                                in: 0,
                                out: 0,
                                inEmployee: 0,
                                outEmployee: 0,
                            };
                        }

                        summary.in += value2.getValue('in');
                        summary.out += value2.getValue('out');
                        summary.inEmployee += value2.getValue('inEmployee');
                        summary.outEmployee += value2.getValue('outEmployee');
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
    public GetSummaryDatas(): IResponse.IReport.IPeopleCountingSummaryData[] {
        try {
            let currSummarys = this.SummaryDatas(this._currReports);

            let prevSummarys = this.SummaryDatas(this._prevReports);

            let summarys = currSummarys.map<IResponse.IReport.IPeopleCountingSummaryData>((value, index, array) => {
                let prevSummary = prevSummarys.find((value1, index1, array1) => {
                    return value1.device.objectId === value.device.objectId && value1.date.getTime() === value.date.getTime() - this.dateGap;
                });

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

            currSummarys.length = 0;
            prevSummarys.length = 0;

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

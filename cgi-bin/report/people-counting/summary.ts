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

            let summaryDatas = report.GetSummaryDatas();

            return {
                peakHours: peakHours,
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
    protected _collection: string = 'ReportPeopleCountingSummary';

    /**
     *
     */
    private _currReportSummarys: IDB.ReportPeopleCountingSummary[] = [];

    /**
     *
     */
    private _prevReportSummarys: IDB.ReportPeopleCountingSummary[] = [];

    /**
     * Initialization
     * @param input
     * @param userSiteIds
     */
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[]): Promise<void> {
        try {
            await super.Initialization(input, userSiteIds);

            let dateGap: number = this.endDate.getTime() - this.startDate.getTime();

            let prevStartDate: Date = new Date(this.startDate.getTime() - dateGap);
            let prevEndDate: Date = new Date(this.startDate);

            let tasks = [];

            tasks.push(this.GetReportSummarys<IDB.ReportPeopleCountingSummary>());
            tasks.push(this.GetReportSummarys<IDB.ReportPeopleCountingSummary>(prevStartDate, prevEndDate));

            let result = await Promise.all(tasks);

            this._currReportSummarys = result[0];
            this._prevReportSummarys = result[1];
        } catch (e) {
            throw e;
        }
    }

    /**
     * Summary datas
     * @param reportSummarys
     */
    public SummaryDatas(reportSummarys: IDB.ReportPeopleCountingSummary[]): IResponse.IReport.IPeopleCountingSummaryData[] {
        try {
            let summarys = reportSummarys.reduce<IResponse.IReport.IPeopleCountingSummaryData[]>((prev, curr, index, array) => {
                let date: Date = this.GetTypeDate(curr.getValue('date'));

                let summary = prev.find((value1, index1, array1) => {
                    return value1.device.objectId === curr.getValue('device').id && value1.date.getTime() === date.getTime();
                });
                if (summary) {
                    summary.in += curr.getValue('in');
                    summary.out += curr.getValue('out');
                } else {
                    let base = this.GetSummaryDataBase(curr);

                    prev.push({
                        ...base,
                        in: curr.getValue('in'),
                        out: curr.getValue('out'),
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
     * Get peak hour
     */
    public GetPeakHours(): IResponse.IReport.IPeakHour[] {
        try {
            let peakHours = this._currReportSummarys.reduce<IResponse.IReport.IPeakHour[]>((prev, curr, index, array) => {
                let data: IResponse.IReport.IPeakHourData = {
                    date: curr.getValue('date'),
                    level: curr.getValue('in'),
                };

                let peakHour = prev.find((value1, index1, array1) => {
                    return value1.date.getTime() === new Date(curr.getValue('date')).setHours(0, 0, 0, 0) && value1.site.objectId === curr.getValue('site').id;
                });
                if (peakHour) {
                    let peakHourData = peakHour.peakHourDatas.find((value1, index1, array1) => {
                        return value1.date.getTime() === curr.getValue('date').getTime();
                    });
                    if (peakHourData) {
                        peakHourData.level += curr.getValue('in');
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
     * Get summary
     */
    public GetSummaryDatas(): IResponse.IReport.IPeopleCountingSummaryData[] {
        try {
            let dateGap: number = this.endDate.getTime() - this.startDate.getTime();

            let currSummarys = this.SummaryDatas(this._currReportSummarys);

            let prevSummarys = this.SummaryDatas(this._prevReportSummarys);

            let summarys = currSummarys.map<IResponse.IReport.IPeopleCountingSummaryData>((value, index, array) => {
                let prevSummary = prevSummarys.find((value1, index1, array1) => {
                    return value1.device.objectId === value.device.objectId && value1.date.getTime() === value.date.getTime() - dateGap;
                });

                // let inVariety: number = prevSummary && prevSummary.in !== 0 ? Utility.Round(value.in / prevSummary.in - 1, 2) : NaN;

                // let outVariety: number = prevSummary && prevSummary.out !== 0 ? Utility.Round(value.out / prevSummary.out - 1, 2) : NaN;

                let prevIn: number = prevSummary ? prevSummary.in : NaN;

                let prevOut: number = prevSummary ? prevSummary.out : NaN;

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
                    weather: value.weather,
                };
            }, []);

            return summarys;
        } catch (e) {
            throw e;
        }
    }
}

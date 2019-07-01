import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Utility } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import Demographic from '../../../custom/actions/demographic';
import { Report } from '../';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin, RoleList.User],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IReport.IDemographicSummary;

type OutputC = IResponse.IReport.IDemographicSummary;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new ReportDemographic();

            await report.Initialization(_input, _userInfo.siteIds);

            let genderRange = report.GetGenderRange();

            let summaryDatas = report.GetSummaryDatas();

            return {
                weathers: report.weathers,
                genderRange: genderRange,
                summaryDatas: summaryDatas,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

export class ReportDemographic extends Report {
    /**
     *
     */
    protected _collection: string = 'ReportDemographicSummary';

    /**
     *
     */
    private _currReportSummarys: IDB.ReportDemographicSummary[] = [];

    /**
     *
     */
    private _prevReportSummarys: IDB.ReportDemographicSummary[] = [];

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

            tasks.push(this.GetReportSummarys<IDB.ReportDemographicSummary>());
            tasks.push(this.GetReportSummarys<IDB.ReportDemographicSummary>(prevStartDate, prevEndDate));

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
    public SummaryDatas(reportSummarys: IDB.ReportDemographicSummary[]): IResponse.IReport.IDemographicSummaryData[] {
        try {
            let summarys = reportSummarys.reduce<IResponse.IReport.IDemographicSummaryData[]>((prev, curr, index, array) => {
                let date: Date = this.GetTypeDate(curr.getValue('date'));

                let summary = prev.find((value1, index1, array1) => {
                    return value1.device.objectId === curr.getValue('device').id && value1.date.getTime() === date.getTime();
                });
                if (summary) {
                    summary.maleTotal += curr.getValue('maleTotal');
                    summary.maleRanges = summary.maleRanges.map((value1, index1, array1) => {
                        return value1 + curr.getValue('maleRanges')[index1];
                    });
                    summary.femaleTotal += curr.getValue('femaleTotal');
                    summary.femaleRanges = summary.femaleRanges.map((value1, index1, array1) => {
                        return value1 + curr.getValue('femaleRanges')[index1];
                    });
                } else {
                    let base = this.GetSummaryDataBase(curr);

                    summary = {
                        ...base,
                        maleTotal: curr.getValue('maleTotal'),
                        maleRanges: curr.getValue('maleRanges'),
                        femaleTotal: curr.getValue('femaleTotal'),
                        femaleRanges: curr.getValue('femaleRanges'),
                    };

                    prev.push(summary);
                }

                return prev;
            }, []);

            return summarys;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get gender range
     */
    public GetGenderRange(): IResponse.IReport.IGenderRange {
        try {
            let genderRange = this._currReportSummarys.reduce<IResponse.IReport.IGenderRange>(
                (prev, curr, index, array) => {
                    prev.maleRanges = curr.getValue('maleRanges').map((value1, index1, array1) => {
                        return value1 + (prev.maleRanges[index1] || 0);
                    });
                    prev.femaleRanges = curr.getValue('femaleRanges').map((value1, index1, array1) => {
                        return value1 + (prev.femaleRanges[index1] || 0);
                    });
                    prev.totalRanges = prev.maleRanges.map((value1, index1, array1) => {
                        return value1 + (prev.femaleRanges[index1] || 0);
                    });

                    return prev;
                },
                {
                    totalRanges: [],
                    maleRanges: [],
                    femaleRanges: [],
                },
            );

            return genderRange;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get summary
     */
    public GetSummaryDatas(): IResponse.IReport.IDemographicSummaryData[] {
        try {
            let dateGap: number = this.endDate.getTime() - this.startDate.getTime();

            let currSummarys = this.SummaryDatas(this._currReportSummarys);

            let prevSummarys = this.SummaryDatas(this._prevReportSummarys);

            let summarys = currSummarys.map<IResponse.IReport.IDemographicSummaryData>((value, index, array) => {
                let prevSummary = prevSummarys.find((value1, index1, array1) => {
                    return value1.device.objectId === value.device.objectId && value1.date.getTime() === value.date.getTime() - dateGap;
                });

                // let malePercentVariety: number = prevSummary && prevSummary.malePercent !== 0 ? Utility.Round(value.malePercent / prevSummary.malePercent - 1, 2) : NaN;

                // let femalePercentVariety: number = prevSummary && prevSummary.femalePercent !== 0 ? Utility.Round(value.femalePercent / prevSummary.femalePercent - 1, 2) : NaN;

                let prevMaleTotal: number = prevSummary ? prevSummary.maleTotal : NaN;

                let prevMaleRanges: number[] = prevSummary ? prevSummary.maleRanges : new Array(Demographic.ageRanges.length).fill(NaN);

                let prevFemaleTotal: number = prevSummary ? prevSummary.femaleTotal : NaN;

                let prevFemaleRanges: number[] = prevSummary ? prevSummary.femaleRanges : new Array(Demographic.ageRanges.length).fill(NaN);

                return {
                    site: value.site,
                    area: value.area,
                    deviceGroups: value.deviceGroups,
                    device: value.device,
                    date: value.date,
                    type: value.type,
                    maleTotal: value.maleTotal,
                    maleRanges: value.maleRanges,
                    prevMaleTotal: prevMaleTotal,
                    prevMaleRanges: prevMaleRanges,
                    femaleTotal: value.femaleTotal,
                    femaleRanges: value.femaleRanges,
                    prevFemaleTotal: prevFemaleTotal,
                    prevFemaleRanges: prevFemaleRanges,
                };
            }, []);

            return summarys;
        } catch (e) {
            throw e;
        }
    }
}

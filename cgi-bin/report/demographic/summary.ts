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
                officeHours: report.officeHours,
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
    private _currReports: IDB.ReportDemographicSummary[] = [];

    /**
     *
     */
    private _prevReports: IDB.ReportDemographicSummary[] = [];

    /**
     * Initialization
     * @param input
     * @param userSiteIds
     */
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[]): Promise<void> {
        try {
            await super.Initialization(input, userSiteIds);

            let tasks = [];

            tasks.push(this.GetReports(IDB.ReportDemographicSummary));
            tasks.push(this.GetReports(IDB.ReportDemographicSummary, this.prevDateRange.startDate, this.prevDateRange.endDate));

            let result = await Promise.all(tasks);

            this._currReports = result[0];
            this._prevReports = result[1];
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get gender range
     */
    public GetGenderRange(): IResponse.IReport.IGenderRange {
        try {
            let genderRange = this._currReports.reduce<IResponse.IReport.IGenderRange>(
                (prev, curr, index, array) => {
                    prev.maleRanges = this.MerageArray(curr.getValue('maleRanges'), prev.maleRanges);
                    prev.femaleRanges = this.MerageArray(curr.getValue('femaleRanges'), prev.femaleRanges);
                    prev.totalRanges = this.MerageArray(prev.maleRanges, prev.femaleRanges);

                    prev.maleEmployeeRanges = this.MerageArray(curr.getValue('maleEmployeeRanges'), prev.maleEmployeeRanges);
                    prev.femaleEmployeeRanges = this.MerageArray(curr.getValue('femaleEmployeeRanges'), prev.femaleEmployeeRanges);
                    prev.totalEmployeeRanges = this.MerageArray(prev.maleEmployeeRanges, prev.femaleEmployeeRanges);

                    return prev;
                },
                {
                    totalRanges: [],
                    maleRanges: [],
                    femaleRanges: [],
                    totalEmployeeRanges: [],
                    maleEmployeeRanges: [],
                    femaleEmployeeRanges: [],
                },
            );

            return genderRange;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Summary datas
     * @param reports
     */
    public SummaryDatas(reports: IDB.ReportDemographicSummary[]): IResponse.IReport.IDemographicSummaryData[] {
        try {
            let summarys = reports.reduce<IResponse.IReport.IDemographicSummaryData[]>((prev, curr, index, array) => {
                let date: Date = this.GetTypeDate(curr.getValue('date'));

                let summary = prev.find((value1, index1, array1) => {
                    return value1.device.objectId === curr.getValue('device').id && value1.date.getTime() === date.getTime();
                });
                if (summary) {
                    summary.maleTotal += curr.getValue('maleTotal');
                    summary.maleRanges = this.MerageArray(summary.maleRanges, curr.getValue('maleRanges'));
                    summary.femaleTotal += curr.getValue('femaleTotal');
                    summary.femaleRanges = this.MerageArray(summary.femaleRanges, curr.getValue('femaleRanges'));
                    summary.maleEmployeeTotal += curr.getValue('maleEmployeeTotal') || 0;
                    summary.maleEmployeeRanges = this.MerageArray(summary.maleEmployeeRanges, curr.getValue('maleEmployeeRanges'));
                    summary.femaleEmployeeTotal += curr.getValue('femaleEmployeeTotal') || 0;
                    summary.femaleEmployeeRanges = this.MerageArray(summary.femaleEmployeeRanges, curr.getValue('femaleEmployeeRanges'));
                } else {
                    let base = this.GetBaseSummaryData(curr);

                    summary = {
                        ...base,
                        maleTotal: curr.getValue('maleTotal'),
                        maleRanges: curr.getValue('maleRanges'),
                        femaleTotal: curr.getValue('femaleTotal'),
                        femaleRanges: curr.getValue('femaleRanges'),
                        maleEmployeeTotal: curr.getValue('maleEmployeeTotal') || 0,
                        maleEmployeeRanges: curr.getValue('maleEmployeeRanges') || new Array(Demographic.ageRanges.length).fill(0),
                        femaleEmployeeTotal: curr.getValue('femaleEmployeeTotal') || 0,
                        femaleEmployeeRanges: curr.getValue('femaleEmployeeRanges') || new Array(Demographic.ageRanges.length).fill(0),
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
     * Get summary
     */
    public GetSummaryDatas(): IResponse.IReport.IDemographicSummaryData[] {
        try {
            let currSummarys = this.SummaryDatas(this._currReports);

            let prevSummarys = this.SummaryDatas(this._prevReports);

            let summarys = currSummarys.map<IResponse.IReport.IDemographicSummaryData>((value, index, array) => {
                let prevSummary = prevSummarys.find((value1, index1, array1) => {
                    return value1.device.objectId === value.device.objectId && value1.date.getTime() === value.date.getTime() - this.dateGap;
                });

                // let malePercentVariety: number = prevSummary && prevSummary.malePercent !== 0 ? Utility.Round(value.malePercent / prevSummary.malePercent - 1, 2) : NaN;

                // let femalePercentVariety: number = prevSummary && prevSummary.femalePercent !== 0 ? Utility.Round(value.femalePercent / prevSummary.femalePercent - 1, 2) : NaN;

                let prevMaleTotal: number = prevSummary ? prevSummary.maleTotal : NaN;
                let prevMaleRanges: number[] = prevSummary ? prevSummary.maleRanges : new Array(Demographic.ageRanges.length).fill(NaN);
                let prevFemaleTotal: number = prevSummary ? prevSummary.femaleTotal : NaN;
                let prevFemaleRanges: number[] = prevSummary ? prevSummary.femaleRanges : new Array(Demographic.ageRanges.length).fill(NaN);

                let prevMaleEmployeeTotal: number = prevSummary ? prevSummary.maleEmployeeTotal : NaN;
                let prevMaleEmployeeRanges: number[] = prevSummary ? prevSummary.maleEmployeeRanges : new Array(Demographic.ageRanges.length).fill(NaN);
                let prevFemaleEmployeeTotal: number = prevSummary ? prevSummary.femaleEmployeeTotal : NaN;
                let prevFemaleEmployeeRanges: number[] = prevSummary ? prevSummary.femaleEmployeeRanges : new Array(Demographic.ageRanges.length).fill(NaN);

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
                    maleEmployeeTotal: value.maleEmployeeTotal,
                    maleEmployeeRanges: value.maleEmployeeRanges,
                    prevMaleEmployeeTotal: prevMaleEmployeeTotal,
                    prevMaleEmployeeRanges: prevMaleEmployeeRanges,
                    femaleEmployeeTotal: value.femaleEmployeeTotal,
                    femaleEmployeeRanges: value.femaleEmployeeRanges,
                    prevFemaleEmployeeTotal: prevFemaleEmployeeTotal,
                    prevFemaleEmployeeRanges: prevFemaleEmployeeRanges,
                };
            }, []);

            return summarys;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Merage array
     * @param array1
     * @param array2
     */
    private MerageArray(array1: number[], array2: number[]): number[] {
        try {
            array1 = array1 && array1.length === Demographic.ageRanges.length ? array1 : new Array(Demographic.ageRanges.length).fill(0);
            array2 = array2 && array2.length === Demographic.ageRanges.length ? array2 : new Array(Demographic.ageRanges.length).fill(0);

            let array: number[] = array1.map((value, index, array) => {
                return (value || 0) + (array2[index] || 0);
            });

            return array;
        } catch (e) {
            throw e;
        }
    }
}

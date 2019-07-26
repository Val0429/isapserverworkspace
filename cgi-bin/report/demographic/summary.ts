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
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new ReportDemographic();

            await report.Initialization(_input, _userInfo.siteIds);

            let weathers = report.summaryWeathers;

            let officeHours = report.summaryOfficeHours;

            let genderRange = report.GetGenderRange();

            let summaryDatas = report.GetSummaryDatas();

            report.Dispose();
            report = null;

            return {
                weathers: weathers,
                officeHours: officeHours,
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

            tasks.push(
                (async () => {
                    this._currReports = await this.GetReports(IDB.ReportDemographicSummary, []);
                })(),
            );
            tasks.push(
                (async () => {
                    this._prevReports = await this.GetReports(IDB.ReportDemographicSummary, [], this.prevDateRange.startDate, this.prevDateRange.endDate);
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
     * Get gender range
     */
    public GetGenderRange(): IResponse.IReport.IGenderRange {
        try {
            let genderRange: IResponse.IReport.IGenderRange = {
                totalRanges: [],
                maleRanges: [],
                femaleRanges: [],
                totalEmployeeRanges: [],
                maleEmployeeRanges: [],
                femaleEmployeeRanges: [],
            };
            this._currReports.forEach((value, index, array) => {
                genderRange.maleRanges = this.MerageArray(value.getValue('maleRanges'), genderRange.maleRanges);
                genderRange.femaleRanges = this.MerageArray(value.getValue('femaleRanges'), genderRange.femaleRanges);
                genderRange.totalRanges = this.MerageArray(genderRange.maleRanges, genderRange.femaleRanges);

                genderRange.maleEmployeeRanges = this.MerageArray(value.getValue('maleEmployeeRanges'), genderRange.maleEmployeeRanges);
                genderRange.femaleEmployeeRanges = this.MerageArray(value.getValue('femaleEmployeeRanges'), genderRange.femaleEmployeeRanges);
                genderRange.totalEmployeeRanges = this.MerageArray(genderRange.maleEmployeeRanges, genderRange.femaleEmployeeRanges);
            });

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

            let summarys: IResponse.IReport.IDemographicSummaryData[] = [];
            Object.keys(reportsDateDeviceDictionary).forEach((value, index, array) => {
                let date = reportsDateDeviceDictionary[value];

                Object.keys(date).forEach((value1, index1, array1) => {
                    let devices = date[value1];

                    let summary: IResponse.IReport.IDemographicSummaryData = undefined;

                    devices.forEach((value2, index2, array2) => {
                        if (index2 === 0) {
                            let base = this.GetBaseSummaryData(value2);

                            summary = {
                                ...base,
                                maleTotal: 0,
                                maleRanges: new Array(Demographic.ageRanges.length).fill(0),
                                femaleTotal: 0,
                                femaleRanges: new Array(Demographic.ageRanges.length).fill(0),
                                maleEmployeeTotal: 0,
                                maleEmployeeRanges: new Array(Demographic.ageRanges.length).fill(0),
                                femaleEmployeeTotal: 0,
                                femaleEmployeeRanges: new Array(Demographic.ageRanges.length).fill(0),
                            };
                        }

                        summary.maleTotal += value2.getValue('maleTotal');
                        summary.maleRanges = this.MerageArray(summary.maleRanges, value2.getValue('maleRanges'));
                        summary.femaleTotal += value2.getValue('femaleTotal');
                        summary.femaleRanges = this.MerageArray(summary.femaleRanges, value2.getValue('femaleRanges'));
                        summary.maleEmployeeTotal += value2.getValue('maleEmployeeTotal') || 0;
                        summary.maleEmployeeRanges = this.MerageArray(summary.maleEmployeeRanges, value2.getValue('maleEmployeeRanges'));
                        summary.femaleEmployeeTotal += value2.getValue('femaleEmployeeTotal') || 0;
                        summary.femaleEmployeeRanges = this.MerageArray(summary.femaleEmployeeRanges, value2.getValue('femaleEmployeeRanges'));
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
    public GetSummaryDatas(): IResponse.IReport.IDemographicSummaryData[] {
        try {
            let currSummarys = this.SummaryDatas(this._currReports);

            let prevSummarys = this.SummaryDatas(this._prevReports);

            let summarys = currSummarys.map<IResponse.IReport.IDemographicSummaryData>((value, index, array) => {
                let prevSummary = prevSummarys.find((value1, index1, array1) => {
                    return value1.device.objectId === value.device.objectId && value1.date.getTime() === value.date.getTime() - this.dateGap;
                });

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

            currSummarys.length = 0;
            prevSummarys.length = 0;

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

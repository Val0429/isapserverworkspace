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

const ageRanges = Utility.Str2ValueRange(Config.deviceDemographic.ageRange);

/**
 * Action Create
 */
type InputC = IRequest.IReport.IRepeatVisitorSummary;

type OutputC = IResponse.IReport.IRepeatVisitorSummary;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new ReportRepeatVisitor();

            await report.Initialization(_input, _userInfo.siteIds);

            let summaryChartDatas = report.GetSummaryChartDatas();

            let summaryTableDatas = report.GetSummaryTableDatas();

            report.Dispose();
            report = null;

            return {
                summaryChartDatas: summaryChartDatas,
                summaryTableDatas: summaryTableDatas,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

export class ReportRepeatVisitor extends Report {
    /**
     *
     */
    private _reports: IDB.ReportRepeatVisitor[] = [];

    /**
     *
     */
    private _ageRanges = ageRanges;

    /**
     *
     */
    private _frequencyRanges: { min: number; max: number }[] = [];

    /**
     * Initialization
     * @param input
     * @param userSiteIds
     */
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[]): Promise<void> {
        try {
            await super.Initialization(input, userSiteIds, { useWeather: false });

            this._frequencyRanges = this.GetFrequencyRange();

            this._reports = await this.GetReports(IDB.ReportRepeatVisitor, []);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Dispose
     */
    public Dispose() {
        try {
            this._reports.length = 0;

            super.Dispose();
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get frequency range
     */
    private GetFrequencyRange(): { min: number; max: number }[] {
        try {
            return Utility.Str2ValueRange(Config.deviceRepeatVisitor.frequencyRange);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Summary chart datas
     * @param reports
     */
    public SummaryChartDatas(reports: IDB.ReportRepeatVisitor[]): IResponse.IReport.IRepeatVisitorSummaryChartData[] {
        try {
            let reportsFaceIdDictionary: object = {};
            reports.forEach((value, index, array) => {
                let key: string = value.getValue('faceId');

                if (!reportsFaceIdDictionary[key]) {
                    reportsFaceIdDictionary[key] = [];
                }

                reportsFaceIdDictionary[key].push(value);
            });

            let summarys = this._frequencyRanges.map<IResponse.IReport.IRepeatVisitorSummaryChartData>((value, index, array) => {
                let totalRanges: number[] = new Array(this._ageRanges.length).fill(0);
                let maleRanges: number[] = new Array(this._ageRanges.length).fill(0);
                let femaleRanges: number[] = new Array(this._ageRanges.length).fill(0);

                return {
                    total: 0,
                    totalRanges: totalRanges,
                    maleRanges: maleRanges,
                    femaleRanges: femaleRanges,
                };
            });
            Object.keys(reportsFaceIdDictionary).forEach((value, index, array) => {
                let faces = reportsFaceIdDictionary[value];

                let frequencyIndex: number = this._frequencyRanges.findIndex((value1, index1, array1) => {
                    return value1.min <= faces.length && (!value1.max || value1.max > faces.length);
                });

                let ageIndex: number = this._ageRanges.findIndex((value1, index1, array1) => {
                    return value1.min <= faces[0].getValue('age') && (!value1.max || value1.max > faces[0].getValue('age'));
                });

                summarys[frequencyIndex].total += 1;

                summarys[frequencyIndex].totalRanges[ageIndex] += 1;
                if (faces[0].getValue('gender') === Enum.EGender.male) {
                    summarys[frequencyIndex].maleRanges[ageIndex] += 1;
                } else {
                    summarys[frequencyIndex].femaleRanges[ageIndex] += 1;
                }
            });

            reportsFaceIdDictionary = null;

            return summarys;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Summary table datas
     * @param reports
     */
    public SummaryTableDatas(reports: IDB.ReportRepeatVisitor[]): IResponse.IReport.IRepeatVisitorSummaryTableData[] {
        try {
            let reportsSiteDateFaceIdDictionary: object = {};
            reports.forEach((value, index, array) => {
                let key: string = value.getValue('site').id;
                let key1: string = this.GetTypeDate(value.getValue('date')).toISOString();
                let key2: string = value.getValue('faceId');

                if (!reportsSiteDateFaceIdDictionary[key]) {
                    reportsSiteDateFaceIdDictionary[key] = {};
                }
                if (!reportsSiteDateFaceIdDictionary[key][key1]) {
                    reportsSiteDateFaceIdDictionary[key][key1] = {};
                }
                if (!reportsSiteDateFaceIdDictionary[key][key1][key2]) {
                    reportsSiteDateFaceIdDictionary[key][key1][key2] = [];
                }

                reportsSiteDateFaceIdDictionary[key][key1][key2].push(value);
            });

            let summarys: IResponse.IReport.IRepeatVisitorSummaryTableData[] = [];
            Object.keys(reportsSiteDateFaceIdDictionary).forEach((value, index, array) => {
                let site = reportsSiteDateFaceIdDictionary[value];

                Object.keys(site).forEach((value1, index1, array1) => {
                    let date = site[value1];

                    let summary: IResponse.IReport.IRepeatVisitorSummaryTableData = undefined;

                    Object.keys(date).forEach((value2, index2, array2) => {
                        let faces = date[value2];

                        if (!summary) {
                            let base = this.GetBaseSummaryData(faces[0]);

                            let frequencyRanges: number[] = new Array(this._frequencyRanges.length).fill(0);

                            summary = {
                                site: base.site,
                                date: base.date,
                                frequencyRanges: frequencyRanges,
                            };
                        }

                        let frequencyIndex: number = this._frequencyRanges.findIndex((value1, index1, array1) => {
                            return value1.min <= faces.length && (!value1.max || value1.max > faces.length);
                        });

                        summary.frequencyRanges[frequencyIndex] += 1;
                    });

                    summarys.push(summary);
                });
            });

            reportsSiteDateFaceIdDictionary = null;

            return summarys;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get chart summary
     */
    public GetSummaryChartDatas(): IResponse.IReport.IRepeatVisitorSummaryChartData[] {
        try {
            let summarys = this.SummaryChartDatas(this._reports);

            return summarys;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get table summary
     */
    public GetSummaryTableDatas(): IResponse.IReport.IRepeatVisitorSummaryTableData[] {
        try {
            let summarys = this.SummaryTableDatas(this._reports);

            return summarys;
        } catch (e) {
            throw e;
        }
    }
}

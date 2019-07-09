import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
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
type InputC = IRequest.IReport.IRepeatVisitorSummary;

type OutputC = IResponse.IReport.IRepeatVisitorSummary;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new ReportRepeatVisitor();

            await report.Initialization(_input, _userInfo.siteIds);

            let summaryChartDatas = report.GetSummaryChartDatas();

            let summaryTableDatas = report.GetSummaryTableDatas();

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
    private _ageRanges = Demographic.ageRanges;

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
            await super.Initialization(input, userSiteIds);

            this.GetFrequencyRange();

            this._reports = await this.GetReports(IDB.ReportRepeatVisitor, []);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get frequency range
     */
    private GetFrequencyRange() {
        try {
            let frequencyRange: string = Config.deviceRepeatVisitor.frequencyRange;
            this._frequencyRanges = frequencyRange
                .split('-')
                .map(Number)
                .reduce((prev, curr, index, array) => {
                    if (index !== 0) {
                        curr += prev[index - 1].min;
                        prev[index - 1].max = curr;
                    }

                    return prev.concat({
                        min: curr,
                        max: undefined,
                    });
                }, []);
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
            let summarys = this._frequencyRanges.map<IResponse.IReport.IRepeatVisitorSummaryChartData>((value, index, array) => {
                let totalRanges: number[] = new Array(this._ageRanges.length).fill(0);
                let maleRanges: number[] = new Array(this._ageRanges.length).fill(0);
                let femaleRanges: number[] = new Array(this._ageRanges.length).fill(0);

                let faces = reports.filter((value1, index1, array1) => {
                    let faces = array1.filter((value2, index2, array2) => {
                        return value2.getValue('faceId') === value1.getValue('faceId');
                    });

                    let frequencyIndex: number = this._frequencyRanges.findIndex((value2, index2, array2) => {
                        return value2.min <= faces.length && (!value2.max || value2.max > faces.length);
                    });

                    let currIndex: number = faces.findIndex((value2, index2, array2) => {
                        return value2.id === value1.id;
                    });

                    if (frequencyIndex === index && currIndex === 0) {
                        let ageIndex: number = this._ageRanges.findIndex((value2, index2, array2) => {
                            return value2.min <= faces[0].getValue('age') && (!value2.max || value2.max > faces[0].getValue('age'));
                        });

                        totalRanges[ageIndex] += 1;
                        if (faces[0].getValue('gender') === Enum.EGender.male) {
                            maleRanges[ageIndex] += 1;
                        } else {
                            femaleRanges[ageIndex] += 1;
                        }

                        return true;
                    }

                    return false;
                });

                return {
                    total: faces.length,
                    totalRanges: totalRanges,
                    maleRanges: maleRanges,
                    femaleRanges: femaleRanges,
                };
            });

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
            let summarys = reports.reduce<IResponse.IReport.IRepeatVisitorSummaryTableData[]>((prev, curr, index, array) => {
                let date: Date = this.GetTypeDate(curr.getValue('date'));

                let summary = prev.find((value1, index1, array1) => {
                    return value1.site.objectId === curr.getValue('site').id && value1.date.getTime() === date.getTime();
                });
                if (!summary) {
                    let base = this.GetBaseSummaryData(curr);

                    let frequencyRanges: number[] = new Array(this._frequencyRanges.length).fill(0);

                    summary = {
                        site: base.site,
                        date: base.date,
                        frequencyRanges: frequencyRanges,
                    };

                    prev.push(summary);
                }

                let faces = array.filter((value1, index1, array1) => {
                    let date1: Date = this.GetTypeDate(value1.getValue('date'));
                    return value1.getValue('site').id === curr.getValue('site').id && date1.getTime() === date.getTime() && value1.getValue('faceId') === curr.getValue('faceId');
                });

                let currIndex: number = faces.findIndex((value1, index1, array1) => {
                    return value1.id === curr.id;
                });
                if (currIndex !== 0) {
                    return prev;
                }

                let frequencyIndex: number = this._frequencyRanges.findIndex((value1, index1, array1) => {
                    return value1.min <= faces.length && (!value1.max || value1.max > faces.length);
                });

                summary.frequencyRanges[frequencyIndex] += 1;

                return prev;
            }, []);

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

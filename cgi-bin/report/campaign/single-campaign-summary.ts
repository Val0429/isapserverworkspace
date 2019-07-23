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
type InputC = IRequest.IReport.ICampaignSingleCampaignSummary;

type OutputC = IResponse.IReport.ICampaignSingleCampaignSummary;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new Campaign();

            let inputBase: IRequest.IReport.ISummaryBase = {
                type: Enum.ESummaryType.day,
                startDate: new Date(),
                endDate: new Date(),
                siteIds: _input.siteIds,
                tagIds: [],
            };
            await report.Initialization(inputBase, _userInfo.siteIds, _input.campaignId);

            let budget: number = report.campaignBudget;

            let traffic: number = report.traffic;

            let beforeTraffic: number = report.beforeTraffic;

            let afterTraffic: number = report.afterTraffic;

            let trafficGainPer: number = Utility.Round((traffic + afterTraffic - 2 * beforeTraffic) / budget, 2);

            let changeTrafficCampaign: number = Utility.Round(traffic / beforeTraffic, 2) - 1;

            let changeAfterTrafficCampaign: number = Utility.Round(traffic / afterTraffic, 2) - 1;

            let summaryDatas = report.GetSummaryDatas();

            report.Dispose();
            report = null;

            return {
                budget: budget,
                trafficGainPer: trafficGainPer,
                traffic: traffic,
                beforeTraffic: beforeTraffic,
                afterTraffic: afterTraffic,
                changeTrafficCampaign: changeTrafficCampaign,
                changeAfterTrafficCampaign: changeAfterTrafficCampaign,
                summaryDatas: summaryDatas,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

export class Campaign extends Report {
    /**
     *
     */
    private _campaign: IDB.EventCampaign = undefined;

    /**
     *
     */
    private _campaignBudget: number = 0;
    public get campaignBudget(): number {
        return this._campaignBudget;
    }

    /**
     *
     */
    private _gap: number = 0;

    /**
     *
     */
    private _reports: IDB.ReportPeopleCountingSummary[] = [];

    /**
     *
     */
    private _reportsDateRange: IDB.IDateRange = undefined;

    /**
     *
     */
    private _traffic: number = 0;
    public get traffic(): number {
        return this._traffic;
    }

    /**
     *
     */
    private _beforeReports: IDB.ReportPeopleCountingSummary[] = [];

    /**
     *
     */
    private _beforeReportsDateRange: IDB.IDateRange = undefined;

    /**
     *
     */
    private _beforeTraffic: number = 0;
    public get beforeTraffic(): number {
        return this._beforeTraffic;
    }

    /**
     *
     */
    private _afterReports: IDB.ReportPeopleCountingSummary[] = [];

    /**
     *
     */
    private _afterReportsDateRange: IDB.IDateRange = undefined;

    /**
     *
     */
    private _afterTraffic: number = 0;
    public get afterTraffic(): number {
        return this._afterTraffic;
    }

    /**
     * Initialization
     * @param input
     * @param userSiteIds
     */
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[]): Promise<void>;
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[], campaignId: string): Promise<void>;
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[], campaignId?: string): Promise<void> {
        try {
            this._campaign = await new Parse.Query(IDB.EventCampaign)
                .equalTo('objectId', campaignId || '')
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!this._campaign) {
                throw Errors.throw(Errors.CustomBadRequest, ['campaign not found']);
            }

            this._campaignBudget = this._campaign.getValue('budget');

            await super.Initialization(input, userSiteIds, { useWeather: false });

            let tasks = [];

            let startDate: Date = new Date(this._campaign.getValue('startDate'));
            let endDate: Date = new Date(new Date(this._campaign.getValue('endDate')).setDate(this._campaign.getValue('endDate').getDate() + 1));

            this._gap = endDate.getTime() - startDate.getTime();

            tasks.push(
                (async () => {
                    this._reportsDateRange = {
                        startDate: new Date(startDate),
                        endDate: new Date(endDate),
                    };
                    this._reports = await this.GetReports(IDB.ReportPeopleCountingSummary, [], this._reportsDateRange.startDate, this._reportsDateRange.endDate);
                })(),
            );

            tasks.push(
                (async () => {
                    this._beforeReportsDateRange = {
                        startDate: new Date(startDate.getTime() - this._gap),
                        endDate: new Date(startDate),
                    };
                    this._beforeReports = await this.GetReports(IDB.ReportPeopleCountingSummary, [], this._beforeReportsDateRange.startDate, this._beforeReportsDateRange.endDate);
                })(),
            );

            tasks.push(
                (async () => {
                    this._afterReportsDateRange = {
                        startDate: new Date(endDate),
                        endDate: new Date(endDate.getTime() + this._gap),
                    };
                    this._afterReports = await this.GetReports(IDB.ReportPeopleCountingSummary, [], this._afterReportsDateRange.startDate, this._afterReportsDateRange.endDate);
                })(),
            );

            await Promise.all(tasks);

            this._traffic = this.SummaryData(this._reports);
            this._beforeTraffic = this.SummaryData(this._beforeReports);
            this._afterTraffic = this.SummaryData(this._afterReports);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Dispose
     */
    public Dispose() {
        try {
            this._afterReports.length = 0;
            this._beforeReports.length = 0;
            this._reports.length = 0;

            super.Dispose();
        } catch (e) {
            throw e;
        }
    }

    /**
     * Summary data
     * @param reports
     */
    public SummaryData(reports: IDB.ReportPeopleCountingSummary[]): number {
        try {
            let traffic: number = 0;
            reports.forEach((value, index, array) => {
                traffic += value.getValue('in') - (value.getValue('inEmployee') || 0);
            });

            return traffic;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Summary datas
     * @param reports
     * @param type
     */
    public SummaryDatas(reports: IDB.ReportPeopleCountingSummary[], type: number, dateRange: IDB.IDateRange): IResponse.IReport.ICampaignSingleCampaignSummaryData[] {
        try {
            let reportsDateDictionary = {};
            reports.forEach((value, index, array) => {
                let key: string = this.GetTypeDate(value.getValue('date')).toISOString();

                if (!reportsDateDictionary[key]) {
                    reportsDateDictionary[key] = [];
                }

                reportsDateDictionary[key].push(value);
            });

            for (let i: number = dateRange.startDate.getTime(); i < dateRange.endDate.getTime(); i += 86400000) {
                let key: string = new Date(i).toISOString();

                if (!reportsDateDictionary[key]) {
                    reportsDateDictionary[key] = [];
                }
            }

            let summarys: IResponse.IReport.ICampaignSingleCampaignSummaryData[] = [];
            Object.keys(reportsDateDictionary).forEach((value, index, array) => {
                let dates = reportsDateDictionary[value];

                let summary: IResponse.IReport.ICampaignSingleCampaignSummaryData = {
                    type: type,
                    date: new Date(value),
                    traffic: 0,
                };

                dates.forEach((value1, index1, array1) => {
                    summary.traffic += value1.getValue('in') - (value1.getValue('inEmployee') || 0);
                });

                summarys.push(summary);
            });

            reportsDateDictionary = null;

            return summarys;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get summary
     */
    public GetSummaryDatas(): IResponse.IReport.ICampaignSingleCampaignSummaryData[] {
        try {
            let summarys = this.SummaryDatas(this._reports, 1, this._reportsDateRange);
            let beforeSummarys = this.SummaryDatas(this._beforeReports, 0, this._beforeReportsDateRange);
            let afterSummarys = this.SummaryDatas(this._afterReports, 2, this._afterReportsDateRange);

            return [...beforeSummarys, ...summarys, ...afterSummarys];
        } catch (e) {
            throw e;
        }
    }
}

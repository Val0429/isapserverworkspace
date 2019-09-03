import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB, IBase } from '../../../custom/models';
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
type InputC = IRequest.IReport.ICampaignMultiCampaignSummary;

type OutputC = IResponse.IReport.ICampaignMultiCampaignSummary;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new Campaign();
            report.mode = Enum.EDeviceMode.peopleCounting;

            let inputBase: IRequest.IReport.ISummaryBase = {
                type: Enum.ESummaryType.day,
                startDate: new Date(),
                endDate: new Date(),
                siteIds: [],
                tagIds: [],
            };
            await report.Initialization(inputBase, _userInfo.siteIds, _input.campaignIds);

            let budgetTotal: number = report.campaignBudgetTotal;

            let summaryDatas = report.GetSummaryDatas();

            report.Dispose();
            report = null;

            return {
                budgetTotal: budgetTotal,
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
    private _campaigns: IDB.EventCampaign[] = [];

    /**
     *
     */
    private _campaignBudgetTotal: number = 0;
    public get campaignBudgetTotal(): number {
        return this._campaignBudgetTotal;
    }

    /**
     *
     */
    private _campaignsIdDictionary: Report.IPublicData<IBase.IObject.IKeyValue<IDB.EventCampaign>> = undefined;
    public get campaignsIdDictionary(): IBase.IObject.IKeyValue<IDB.EventCampaign> {
        if (!this._campaignsIdDictionary || this._campaignsIdDictionary.initTime < this.initTime) {
            let data = {};
            this._campaigns.forEach((value, index, array) => {
                let key: string = value.id;

                data[key] = value;
            });

            this._campaignsIdDictionary = {
                initTime: new Date().getTime(),
                data: data,
            };
        }

        return this._campaignsIdDictionary.data;
    }

    /**
     *
     */
    private _reportsCampaignIdDictionary: IBase.IObject.IKeyValue<IDB.ReportPeopleCountingSummary[]> = {};

    /**
     *
     */
    private _beforeReportsCampaignIdDictionary: IBase.IObject.IKeyValue<IDB.ReportPeopleCountingSummary[]> = {};

    /**
     *
     */
    private _afterReportsCampaignIdDictionary: IBase.IObject.IKeyValue<IDB.ReportPeopleCountingSummary[]> = {};

    /**
     * Initialization
     * @param input
     * @param userSiteIds
     */
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[]): Promise<void>;
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[], campaignIds: string[]): Promise<void>;
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[], campaignIds?: string[]): Promise<void> {
        try {
            this._campaigns = await new Parse.Query(IDB.EventCampaign)
                .containedIn('objectId', campaignIds || [])
                .find()
                .fail((e) => {
                    throw e;
                });

            let siteIds: string[] = [];
            this._campaigns.forEach((value, index, array) => {
                value.getValue('sites').forEach((value1, index1, array1) => {
                    if (siteIds.indexOf(value1.id) < 0) {
                        siteIds.push(value1.id);
                    }
                });
            });

            input.siteIds = siteIds;

            await super.Initialization(input, userSiteIds, { useWeather: false });

            let tasks = [];

            this._campaignBudgetTotal = 0;
            this._campaigns.forEach((value, index, array) => {
                let startDate: Date = new Date(value.getValue('startDate'));
                let endDate: Date = new Date(new Date(value.getValue('endDate')).setDate(value.getValue('endDate').getDate() + 1));

                let key: string = value.id;
                let gap: number = value.getValue('endDate').getTime() - value.getValue('startDate').getTime();

                this._campaignBudgetTotal += value.getValue('budget');

                tasks.push(
                    (async () => {
                        let start: Date = new Date(startDate);
                        let end: Date = new Date(endDate);
                        this._reportsCampaignIdDictionary[key] = await this.GetReports(IDB.ReportPeopleCountingSummary, [], start, end);
                    })(),
                );

                tasks.push(
                    (async () => {
                        let start: Date = new Date(startDate.getTime() - gap);
                        let end: Date = new Date(startDate);
                        this._beforeReportsCampaignIdDictionary[key] = await this.GetReports(IDB.ReportPeopleCountingSummary, [], start, end);
                    })(),
                );

                tasks.push(
                    (async () => {
                        let start: Date = new Date(endDate);
                        let end: Date = new Date(endDate.getTime() + gap);
                        this._afterReportsCampaignIdDictionary[key] = await this.GetReports(IDB.ReportPeopleCountingSummary, [], start, end);
                    })(),
                );
            });

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
            this._campaigns.length = 0;
            this._campaignsIdDictionary = null;
            this._afterReportsCampaignIdDictionary = null;
            this._beforeReportsCampaignIdDictionary = null;
            this._reportsCampaignIdDictionary = null;

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
     * Get summary
     */
    public GetSummaryDatas(): IResponse.IReport.ICampaignMultiCampaignSummaryData[] {
        try {
            let summarys = Object.keys(this.campaignsIdDictionary).map<IResponse.IReport.ICampaignMultiCampaignSummaryData>((value, index, array) => {
                let campaign = this.campaignsIdDictionary[value];
                let campaignObject: IResponse.IObject = {
                    objectId: campaign.id,
                    name: campaign.getValue('name'),
                };

                let traffic: number = this.SummaryData(this._reportsCampaignIdDictionary[value] || []);
                let beforeTraffic: number = this.SummaryData(this._beforeReportsCampaignIdDictionary[value] || []);
                let afterTraffic: number = this.SummaryData(this._afterReportsCampaignIdDictionary[value] || []);

                return {
                    campaign: campaignObject,
                    budget: campaign.getValue('budget'),
                    budgetPercent: Utility.Round(campaign.getValue('budget') / this._campaignBudgetTotal, 3),
                    startDate: campaign.getValue('startDate'),
                    endDate: campaign.getValue('endDate'),
                    traffic: traffic,
                    trafficGainPer: Utility.Round((traffic + afterTraffic - 2 * beforeTraffic) / campaign.getValue('budget'), 2),
                };
            });

            return summarys;
        } catch (e) {
            throw e;
        }
    }
}

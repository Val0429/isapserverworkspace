import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Utility } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { Report } from '../';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin, RoleList.User],
});

export default action;

const gridUnit: number = Config.deviceHeatmap.gridUnit;

/**
 * Action Create
 */
type InputC = IRequest.IReport.IHeatmapSummary;

type OutputC = IResponse.IReport.IHeatmapSummary;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new ReportHeatmap();

            let inputBase: IRequest.IReport.ISummaryBase = {
                type: _input.type,
                startDate: _input.startDate,
                endDate: _input.endDate,
                siteIds: [_input.siteId],
                tagIds: [],
            };
            await report.Initialization(inputBase, _userInfo.siteIds);

            let summaryDatas = report.GetSummaryDatas();

            report.Dispose();
            report = null;

            return {
                summaryDatas: summaryDatas,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

export class ReportHeatmap extends Report {
    /**
     *
     */
    private _reports: IDB.ReportHeatmapSummary[] = [];

    /**
     * Initialization
     * @param input
     * @param userSiteIds
     */
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[]): Promise<void> {
        try {
            await super.Initialization(input, userSiteIds, { useWeather: false });

            let tasks = [];

            tasks.push(
                (async () => {
                    this._reports = await this.GetReports(IDB.ReportHeatmapSummary, []);
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
            this._reports.length = 0;

            super.Dispose();
        } catch (e) {
            throw e;
        }
    }

    /**
     * Summary datas
     * @param reports
     */
    public SummaryDatas(reports: IDB.ReportHeatmapSummary[]): IResponse.IReport.IHeatmapSummaryData[] {
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

            let summarys: IResponse.IReport.IHeatmapSummaryData[] = [];
            Object.keys(reportsDateDeviceDictionary).forEach((value, index, array) => {
                let date = reportsDateDeviceDictionary[value];

                Object.keys(date).forEach((value1, index1, array1) => {
                    let devices = date[value1];

                    let summary: IResponse.IReport.IHeatmapSummaryData = undefined;

                    devices.forEach((value1, index1, array1) => {
                        if (summary && (summary.width !== value1.getValue('width') || summary.height !== value1.getValue('height'))) {
                            summarys.push(summary);
                            summary = undefined;
                        }

                        if (!summary) {
                            let base = this.GetBaseSummaryData(value1);

                            summary = {
                                ...base,
                                imageSrc: value1.getValue('imageSrc'),
                                gridUnit: gridUnit,
                                width: value1.getValue('width'),
                                height: value1.getValue('height'),
                                scores: undefined,
                            };
                        }

                        summary.scores = summary.scores ? this.MerageArray(summary.scores, value1.getValue('scores')) : value1.getValue('scores');
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
    public GetSummaryDatas(): IResponse.IReport.IHeatmapSummaryData[] {
        try {
            let summarys = this.SummaryDatas(this._reports);

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
    public MerageArray(array1: number[][], array2: number[][]): number[][] {
        try {
            let array: number[][] = JSON.parse(JSON.stringify(array1));

            for (let i: number = 0; i < array.length; i++) {
                for (let j: number = 0; j < array[i].length; j++) {
                    array[i][j] += array2[i][j];
                }
            }

            return array;
        } catch (e) {
            throw e;
        }
    }
}

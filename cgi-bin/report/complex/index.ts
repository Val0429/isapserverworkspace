import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Utility } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { ReportSummary } from '../';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IReport.IComplex;

type OutputC = IResponse.IReport.IComplex;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new ReportComplex();

            await report.Initialization(_input, _userInfo.siteIds);

            let tasks = [];

            let currPCSummary: IResponse.IReport.IComplex_Count = undefined;
            tasks.push(
                (async () => {
                    currPCSummary = await report.GetPeopleCountingSummary();
                })(),
            );

            let prevPCSummary: IResponse.IReport.IComplex_Count = undefined;
            tasks.push(
                (async () => {
                    prevPCSummary = await report.GetPeopleCountingSummary(report.prevDateRange.startDate, report.prevDateRange.endDate);
                })(),
            );

            let currDemoSummary: IResponse.IReport.IComplex_Gender = undefined;
            tasks.push(
                (async () => {
                    currDemoSummary = await report.GetDemographicSummary();
                })(),
            );

            let prevDemoSummary: IResponse.IReport.IComplex_Gender = undefined;
            tasks.push(
                (async () => {
                    prevDemoSummary = await report.GetDemographicSummary(report.prevDateRange.startDate, report.prevDateRange.endDate);
                })(),
            );

            let currHDSummary: number = undefined;
            tasks.push(
                (async () => {
                    currHDSummary = await report.GetHumanDetectionSummary();
                })(),
            );

            let prevHDSummary: number = undefined;
            tasks.push(
                (async () => {
                    prevHDSummary = await report.GetHumanDetectionSummary(report.prevDateRange.startDate, report.prevDateRange.endDate);
                })(),
            );

            let currSRSummary: IResponse.IReport.IComplex_SalesRecord = undefined;
            tasks.push(
                (async () => {
                    currSRSummary = await report.GetSalesRecordSummary();
                })(),
            );

            let prevSRSummary: IResponse.IReport.IComplex_SalesRecord = undefined;
            tasks.push(
                (async () => {
                    prevSRSummary = await report.GetSalesRecordSummary(report.prevDateRange.startDate, report.prevDateRange.endDate);
                })(),
            );

            let currRVSummary: number = undefined;
            tasks.push(
                (async () => {
                    currRVSummary = await report.GetRepeatVisitorSummary();
                })(),
            );

            let prevRVSummary: number = undefined;
            tasks.push(
                (async () => {
                    prevRVSummary = await report.GetRepeatVisitorSummary(report.prevDateRange.startDate, report.prevDateRange.endDate);
                })(),
            );

            await Promise.all(tasks);

            let weather = report.GetWeather();

            report.Dispose();
            report = null;

            let pc: IResponse.IReport.IComplex_Data = {
                value: currPCSummary.in,
                variety: prevPCSummary.in !== 0 ? Utility.Round(currPCSummary.in / prevPCSummary.in - 1, 2) : NaN,
            };

            let demo: IResponse.IReport.IComplex_Data_Demographic = {
                malePercent: currDemoSummary.malePercent,
                maleVariety: prevDemoSummary.malePercent !== 0 ? Utility.Round(currDemoSummary.malePercent / prevDemoSummary.malePercent - 1, 2) : NaN,
                femalePercent: currDemoSummary.femalePercent,
                femaleVariety: prevDemoSummary.femalePercent !== 0 ? Utility.Round(currDemoSummary.femalePercent / prevDemoSummary.femalePercent - 1, 2) : NaN,
            };

            let hd: IResponse.IReport.IComplex_Data = {
                value: currHDSummary,
                variety: prevHDSummary - currHDSummary,
            };

            let rv: IResponse.IReport.IComplex_Data = {
                value: currRVSummary,
                variety: prevRVSummary - currRVSummary,
            };

            let revenue: IResponse.IReport.IComplex_Data = {
                value: currSRSummary.revenue,
                variety: prevSRSummary.revenue !== 0 ? Utility.Round(currSRSummary.revenue / prevSRSummary.revenue - 1, 2) : NaN,
            };

            let transaction: IResponse.IReport.IComplex_Data = {
                value: currSRSummary.transaction,
                variety: prevSRSummary.transaction !== 0 ? Utility.Round(currSRSummary.transaction / prevSRSummary.transaction - 1, 2) : NaN,
            };

            let currConversion: number = currPCSummary.in !== 0 ? currSRSummary.transaction / currPCSummary.in : NaN;
            let prevConversion: number = prevPCSummary.in !== 0 ? prevSRSummary.transaction / prevPCSummary.in : NaN;
            let conversion: IResponse.IReport.IComplex_Data = {
                value: Utility.Round(currConversion, 2),
                variety: prevConversion !== 0 ? Utility.Round(currConversion / prevConversion - 1, 2) : NaN,
            };

            let currAsp: number = currSRSummary.transaction !== 0 ? currSRSummary.revenue / currSRSummary.transaction : NaN;
            let prevAsp: number = prevSRSummary.transaction !== 0 ? prevSRSummary.revenue / prevSRSummary.transaction : NaN;
            let asp: IResponse.IReport.IComplex_Data = {
                value: Utility.Round(currAsp, 2),
                variety: prevAsp !== 0 ? Utility.Round(currAsp / prevAsp - 1, 2) : NaN,
            };

            return {
                peopleCounting: pc,
                humanDetection: hd,
                dwellTime: undefined,
                demographic: demo,
                visitor: undefined,
                repeatVisitor: rv,
                revenue: revenue,
                transaction: transaction,
                conversion: conversion,
                asp: asp,
                weather: weather,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

export class ReportComplex extends ReportSummary {
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

            this._frequencyRanges = this.GetFrequencyRange();
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get frequency range
     */
    private GetFrequencyRange(): { min: number; max: number }[] {
        try {
            let frequencyRange: string = Config.deviceRepeatVisitor.frequencyRange;

            return frequencyRange
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
     * Get weather with one site and one day
     */
    public GetWeather(): IResponse.IReport.ISummaryWeather {
        try {
            if (!this.summaryWeathers || this.summaryWeathers.length !== 1 || !this.summaryWeathers[0]) {
                return undefined;
            }

            return this.summaryWeathers[0];
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get report summary
     * @param startDate
     * @param endDate
     */
    public async GetPeopleCountingSummary(): Promise<IResponse.IReport.IComplex_Count>;
    public async GetPeopleCountingSummary(startDate: Date, endDate: Date): Promise<IResponse.IReport.IComplex_Count>;
    public async GetPeopleCountingSummary(startDate?: Date, endDate?: Date): Promise<IResponse.IReport.IComplex_Count> {
        try {
            let summarys = await this.GetReports(IDB.ReportPeopleCountingSummary, [], startDate, endDate);
            if (summarys.length === 0) {
                return {
                    in: NaN,
                    out: NaN,
                };
            }

            let summary: IResponse.IReport.IComplex_Count = {
                in: 0,
                out: 0,
            };
            summarys.forEach((value, index, array) => {
                summary.in += value.getValue('in') - (value.getValue('inEmployee') || 0);
                summary.out += value.getValue('out') - (value.getValue('outEmployee') || 0);
            });

            summarys.length = 0;

            return summary;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get report summary
     * @param startDate
     * @param endDate
     */
    public async GetDemographicSummary(): Promise<IResponse.IReport.IComplex_Gender>;
    public async GetDemographicSummary(startDate: Date, endDate: Date): Promise<IResponse.IReport.IComplex_Gender>;
    public async GetDemographicSummary(startDate?: Date, endDate?: Date): Promise<IResponse.IReport.IComplex_Gender> {
        try {
            let summarys = await this.GetReports(IDB.ReportDemographicSummary, [], startDate, endDate);
            if (summarys.length === 0) {
                return {
                    malePercent: NaN,
                    femalePercent: NaN,
                };
            }

            let summary: IResponse.IReport.IComplex_Gender = {
                malePercent: 0,
                femalePercent: 0,
            };
            summarys.forEach((value, index, array) => {
                summary.malePercent += value.getValue('maleTotal') - (value.getValue('maleEmployeeTotal') || 0);
                summary.femalePercent += value.getValue('femaleTotal') - (value.getValue('femaleEmployeeTotal') || 0);
            });

            summarys.length = 0;

            summary.malePercent = Utility.Round(summary.malePercent / (summary.malePercent + summary.femalePercent), 2);
            summary.femalePercent = Utility.Round(1 - summary.malePercent, 2);

            return summary;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get report summary
     * @param startDate
     * @param endDate
     */
    public async GetHumanDetectionSummary(): Promise<number>;
    public async GetHumanDetectionSummary(startDate: Date, endDate: Date): Promise<number>;
    public async GetHumanDetectionSummary(startDate?: Date, endDate?: Date): Promise<number> {
        try {
            let summarys = await this.GetReports(IDB.ReportHumanDetectionSummary, [], startDate, endDate);
            if (summarys.length === 0) {
                return NaN;
            }

            let summary: IResponse.IReport.IComplex_Average = {
                total: 0,
                count: 0,
            };
            summarys.forEach((value, index, array) => {
                summary.total += value.getValue('total');
                summary.count += value.getValue('count');
            });

            let devices = summarys.filter((value, index, array) => {
                return (
                    array.findIndex((value1, index1, array1) => {
                        return value1.getValue('device').id === value.getValue('device').id;
                    }) === index
                );
            });

            summarys.length = 0;

            let average: number = summary.count !== 0 ? Utility.Round((summary.total * devices.length) / summary.count, 0) : 0;

            return average;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get report summary
     * @param startDate
     * @param endDate
     */
    public async GetRepeatVisitorSummary(): Promise<number>;
    public async GetRepeatVisitorSummary(startDate: Date, endDate: Date): Promise<number>;
    public async GetRepeatVisitorSummary(startDate?: Date, endDate?: Date): Promise<number> {
        try {
            let summarys = await this.GetReports(IDB.ReportRepeatVisitor, [], startDate, endDate);
            if (summarys.length === 0) {
                return NaN;
            }

            let summarysFaceIdDictionary: object = {};
            summarys.forEach((value, index, array) => {
                let key: string = value.getValue('faceId');

                if (!summarysFaceIdDictionary[key]) {
                    summarysFaceIdDictionary[key] = [];
                }

                summarysFaceIdDictionary[key].push(value);
            });

            summarys.length = 0;

            let summary: IResponse.IReport.IComplex_Average = {
                total: 0,
                count: 0,
            };
            Object.keys(summarysFaceIdDictionary).forEach((value, index, array) => {
                let faces = summarysFaceIdDictionary[value];

                let frequencyIndex: number = this._frequencyRanges.findIndex((value1, index1, array1) => {
                    return value1.min <= faces.length && value1.max > faces.length;
                });

                if (frequencyIndex !== 0) {
                    summary.count += 1;
                }
                summary.total += 1;
            });

            summarysFaceIdDictionary = null;

            let average: number = summary.total !== 0 ? Utility.Round(summary.count / summary.total, 2) : 0;

            return average;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get report summary
     * @param startDate
     * @param endDate
     */
    public async GetSalesRecordSummary(): Promise<IResponse.IReport.IComplex_SalesRecord>;
    public async GetSalesRecordSummary(startDate: Date, endDate: Date): Promise<IResponse.IReport.IComplex_SalesRecord>;
    public async GetSalesRecordSummary(startDate?: Date, endDate?: Date): Promise<IResponse.IReport.IComplex_SalesRecord> {
        try {
            let summarys = await this.GetSalesRecords(startDate, endDate);
            if (summarys.length === 0) {
                return {
                    revenue: NaN,
                    transaction: NaN,
                };
            }

            let summary: IResponse.IReport.IComplex_SalesRecord = {
                revenue: 0,
                transaction: 0,
            };
            summarys.forEach((value, index, array) => {
                summary.revenue += value.getValue('revenue');
                summary.transaction += value.getValue('transaction');
            });

            summarys.length = 0;

            return summary;
        } catch (e) {
            throw e;
        }
    }
}

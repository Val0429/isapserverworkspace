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
type InputC = IRequest.IReport.IComplex;

type OutputC = IResponse.IReport.IComplex;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let report = new ReportComplex();

            await report.Initialization(_input, _userInfo.siteIds);

            let tasks = [];

            tasks.push(report.GetPeopleCountingSummary());
            tasks.push(report.GetPeopleCountingSummary(report.prevDateRange.startDate, report.prevDateRange.endDate));
            tasks.push(report.GetDemographicSummary());
            tasks.push(report.GetDemographicSummary(report.prevDateRange.startDate, report.prevDateRange.endDate));
            tasks.push(report.GetSalesRecordSummary());
            tasks.push(report.GetSalesRecordSummary(report.prevDateRange.startDate, report.prevDateRange.endDate));

            let result = await Promise.all(tasks);

            let currPCSummary = result[0];
            let prevPCSummary = result[1];

            let currDemoSummary = result[2];
            let prevDemoSummary = result[3];

            let currSRSummary = result[4];
            let prevSRSummary = result[5];

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
                humanDetection: undefined,
                dwellTime: undefined,
                demographic: demo,
                visitor: undefined,
                repeatCustomer: undefined,
                revenue: revenue,
                transaction: transaction,
                conversion: conversion,
                asp: asp,
                weather: report.GetWeather(),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

export class ReportComplex extends Report {
    /**
     * Get weather with one site and one day
     */
    public GetWeather(): IResponse.IReport.ISummaryWeather {
        try {
            if (!this.weathers || this.weathers.length !== 1 || !this.weathers[0]) {
                return undefined;
            }

            return this.weathers[0];
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
            let summarys = await this.GetReports(IDB.ReportPeopleCountingSummary, startDate, endDate);
            if (summarys.length === 0) {
                return {
                    in: NaN,
                    out: NaN,
                };
            }

            let summary = summarys.reduce<IResponse.IReport.IComplex_Count>(
                (prev, curr, index, array) => {
                    prev.in += curr.getValue('in') - (curr.getValue('inEmployee') || 0);
                    prev.out += curr.getValue('out') - (curr.getValue('outEmployee') || 0);

                    return prev;
                },
                {
                    in: 0,
                    out: 0,
                },
            );

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
            let summarys = await this.GetReports(IDB.ReportDemographicSummary, startDate, endDate);
            if (summarys.length === 0) {
                return {
                    malePercent: NaN,
                    femalePercent: NaN,
                };
            }

            let summary = summarys.reduce<IResponse.IReport.IComplex_Gender>(
                (prev, curr, index, array) => {
                    prev.malePercent += curr.getValue('maleTotal') - (curr.getValue('maleEmployeeTotal') || 0);
                    prev.femalePercent += curr.getValue('femaleTotal') - (curr.getValue('femaleEmployeeTotal') || 0);

                    return prev;
                },
                {
                    malePercent: 0,
                    femalePercent: 0,
                },
            );

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

            let summary = summarys.reduce<IResponse.IReport.IComplex_SalesRecord>(
                (prev, curr, index, array) => {
                    prev.revenue += curr.getValue('revenue');
                    prev.transaction += curr.getValue('transaction');

                    return prev;
                },
                {
                    revenue: 0,
                    transaction: 0,
                },
            );

            return summary;
        } catch (e) {
            throw e;
        }
    }
}

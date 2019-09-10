import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IReportBase } from './_index';
import * as Enum from '../../enums';

/**
 *
 */
export interface IReportDemographicSummaryData {
    /**
     * 總和
     */
    total: number;

    /**
     * 男性總和
     */
    maleTotal: number;

    /**
     * Employee
     */
    maleEmployeeTotal: number;

    /**
     * 男性分區
     */
    maleRanges: number[];

    /**
     * Employee
     */
    maleEmployeeRanges: number[];

    /**
     * 女性總和
     */
    femaleTotal: number;

    /**
     * Employee
     */
    femaleEmployeeTotal: number;

    /**
     * 女性分區
     */
    femaleRanges: number[];

    /**
     * Employee
     */
    femaleEmployeeRanges: number[];
}

/**
 * 報告
 */
export interface IReportDemographicSummary extends IReportBase, IReportDemographicSummaryData {
    /**
     * 累計模式
     */
    type: Enum.ESummaryType;
}

@registerSubclass()
export class ReportDemographicSummary extends ParseObjectNotice<IReportDemographicSummary> {}

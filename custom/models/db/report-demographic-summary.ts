import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IReportBase } from './_index';
import * as Enum from '../../enums';

/**
 *
 */
export interface IReportAgeRange {
    /**
     * 總和
     */
    total: number;

    /**
     * 男性
     */
    male: number;

    /**
     * Employee
     */
    maleEmployee: number;

    /**
     * 女性
     */
    female: number;

    /**
     * Employee
     */
    femaleEmployee: number;

    /**
     * 停留時間
     */
    dwellTimeRanges: number[];

    /**
     * Employee
     */
    dwellTimeEmployeeRanges: number[];
}

/**
 * 報告
 */
export interface IReportDemographicSummary extends IReportBase {
    /**
     * 累計模式
     */
    type: Enum.ESummaryType;

    /**
     *
     */
    ageRanges: IReportAgeRange[];
}

@registerSubclass()
export class ReportDemographicSummary extends ParseObjectNotice<IReportDemographicSummary> {}

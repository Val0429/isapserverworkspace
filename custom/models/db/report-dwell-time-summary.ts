import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IReportBase, IReportDemographicSummaryData } from './_index';
import * as Enum from '../../enums';

/**
 * 報告
 */
export interface IReportDwellTimeSummary extends IReportBase {
    /**
     * 累計模式
     */
    type: Enum.ESummaryType;

    /**
     * 秒數總和
     */
    total: number;

    /**
     * 筆數
     */
    count: number;

    /**
     *
     */
    totalRanges: number[];

    /**
     *
     */
    dwellTimeRanges: IReportDemographicSummaryData[];
}

@registerSubclass()
export class ReportDwellTimeSummary extends ParseObjectNotice<IReportDwellTimeSummary> {}

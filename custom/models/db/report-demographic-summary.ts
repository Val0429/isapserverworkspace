import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IReportBase } from './_index';
import * as Enum from '../../enums';

/**
 * 報告
 */
export interface IReportDemographicSummary extends IReportBase {
    /**
     * 累計模式
     */
    type: Enum.ESummaryType;

    /**
     * 總和
     */
    total: number;

    /**
     * 男性總和
     */
    maleTotal: number;

    /**
     * 男性分區
     */
    maleRanges: number[];

    /**
     * 女性總和
     */
    femaleTotal: number;

    /**
     * 女性分區
     */
    femaleRanges: number[];
}

@registerSubclass()
export class ReportDemographicSummary extends ParseObjectNotice<IReportDemographicSummary> {}

import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IReportBase, ReportHumanDetection } from './_index';
import * as Enum from '../../enums';

/**
 * 報告累計
 */
export interface IReportHumanDetectionSummary extends IReportBase {
    /**
     * 累計模式
     */
    type: Enum.ESummaryType;

    /**
     * 總和
     */
    total: number;

    /**
     * 筆數
     */
    count: number;

    /**
     * 最大
     */
    max: ReportHumanDetection;

    /**
     * 最小
     */
    min: ReportHumanDetection;
}

@registerSubclass()
export class ReportHumanDetectionSummary extends ParseObject<IReportHumanDetectionSummary> {}

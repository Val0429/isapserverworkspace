import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IReportBase } from './_index';
import * as Enum from '../../enums';

/**
 * 報告累計
 */
export interface IReportHeatmapSummary extends IReportBase {
    /**
     * 累計模式
     */
    type: Enum.ESummaryType;

    /**
     * 圖片寬度
     */
    width: number;

    /**
     * 圖片高度
     */
    height: number;

    /**
     * 最大值
     */
    maxValue: number;

    /**
     * 筆數
     */
    scores: number[][];
}

@registerSubclass()
export class ReportHeatmapSummary extends ParseObjectNotice<IReportHeatmapSummary> {}

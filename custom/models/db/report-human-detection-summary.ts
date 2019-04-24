import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { LocationFloor, LocationArea, LocationDevice, ReportHumanDetection } from './_index';
import * as Enum from '../../enums';

/**
 * 報告累計
 */
export interface IReportHumanDetectionSummary {
    /**
     * 樓層
     */
    floor: LocationFloor;

    /**
     * 區域
     */
    area: LocationArea;

    /**
     * 裝置
     */
    device: LocationDevice;

    /**
     * 累計模式
     */
    type: Enum.ESummaryType;

    /**
     * 時間
     */
    date: Date;

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

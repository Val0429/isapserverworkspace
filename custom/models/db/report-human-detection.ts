import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IReportBase } from './_index';
import { HumanDetection } from '../../helpers';

/**
 * 報告
 */
export interface IReportHumanDetection extends IReportBase {
    /**
     * 照片
     */
    imageSrc: string;

    /**
     * 筆數
     */
    value: number;

    /**
     * 辨識結果
     */
    results: HumanDetection.ILocation[];
}

@registerSubclass()
export class ReportHumanDetection extends ParseObject<IReportHumanDetection> {}

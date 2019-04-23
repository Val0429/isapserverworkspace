import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { LocationDevice } from './_index';
import { HumanDetection } from '../../helpers';

/**
 * 報告
 */
export interface IReportHumanDetection {
    /**
     * 裝置
     */
    device: LocationDevice;

    /**
     * 時間
     */
    date: Date;

    /**
     * 照片
     */
    imageSrc: string;

    /**
     * 總數
     */
    total: number;

    /**
     * 辨識結果
     */
    results: HumanDetection.ILocation[];
}

@registerSubclass()
export class ReportHumanDetection extends ParseObject<IReportHumanDetection> {}

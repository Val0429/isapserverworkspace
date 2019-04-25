import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { LocationFloor, LocationArea, LocationDevice } from './_index';
import { HumanDetection } from '../../helpers';

/**
 * 報告
 */
export interface IReportHumanDetection {
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
     * 時間
     */
    date: Date;

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

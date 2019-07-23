import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IReportBase } from './_index';

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
}

@registerSubclass()
export class ReportHumanDetection extends ParseObjectNotice<IReportHumanDetection> {}

import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IReportBase } from './_index';
import * as Enum from '../../enums';

/**
 * 報告
 */
export interface IReportDemographic extends IReportBase {
    /**
     * 照片
     */
    imageSrc: string;

    /**
     * 年齡
     */
    age: number;

    /**
     * 性別
     */
    gender: Enum.EGender;
}

@registerSubclass()
export class ReportDemographic extends ParseObject<IReportDemographic> {}

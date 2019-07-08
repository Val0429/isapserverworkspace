import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IReportBase } from './_index';
import * as Enum from '../../enums';

/**
 * 報告
 */
export interface IReportRepeatVisitor extends IReportBase {
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

    /**
     * Face id
     */
    faceId: string;
}

@registerSubclass()
export class ReportRepeatVisitor extends ParseObjectNotice<IReportRepeatVisitor> {}

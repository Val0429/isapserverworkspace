import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IReportBase } from './_index';
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

    /**
     *
     */
    isEmployee: boolean;

    /**
     * FRS user group
     */
    userGroups: Enum.EPeopleType[];

    /**
     * Face id
     */
    faceId: string;

    /**
     * 進入時間
     */
    inDate: Date;

    /**
     * 出去時間
     */
    outDate: Date;

    /**
     * 停留時間
     */
    dwellTimeSecond: number;

    /**
     * 停留時間等級
     */
    dwellTimeLevel: number;
}

@registerSubclass()
export class ReportDemographic extends ParseObjectNotice<IReportDemographic> {}

import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IReportBase } from './_index';
import * as Enum from '../../enums';

/**
 * 報告
 */
export interface IReportIdentityPerson extends IReportBase {
    /**
     * 照片
     */
    imageSrc: string;

    /**
     * FRS user group
     */
    userGroups: Enum.EPeopleType[];

    /**
     * Face id
     */
    faceId: string;

    /**
     * Name
     */
    name: string;

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
}

@registerSubclass()
export class ReportIdentityPerson extends ParseObjectNotice<IReportIdentityPerson> {}

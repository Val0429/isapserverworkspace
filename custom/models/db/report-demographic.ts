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
}

@registerSubclass()
export class ReportDemographic extends ParseObjectNotice<IReportDemographic> {}

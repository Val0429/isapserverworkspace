import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IReportBase } from './_index';
import * as Enum from '../../enums';

/**
 * 報告
 */
export interface IReportPeopleCounting extends IReportBase {
    /**
     * 照片
     */
    imageSrc: string;

    /**
     *
     */
    isIn: boolean;

    /**
     * FRS user group
     */
    userGroups: Enum.EPeopleType[];
}

@registerSubclass()
export class ReportPeopleCounting extends ParseObjectNotice<IReportPeopleCounting> {}

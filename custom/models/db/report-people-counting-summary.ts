import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IReportBase } from './_index';
import * as Enum from '../../enums';

/**
 * 報告
 */
export interface IReportPeopleCountingSummary extends IReportBase {
    /**
     * 累計模式
     */
    type: Enum.ESummaryType;

    /**
     * in
     */
    in: number;

    /**
     * out
     */
    out: number;

    /**
     * in 總和
     */
    inTotal: number;

    /**
     * out 總和
     */
    outTotal: number;
}

@registerSubclass()
export class ReportPeopleCountingSummary extends ParseObjectNotice<IReportPeopleCountingSummary> {}

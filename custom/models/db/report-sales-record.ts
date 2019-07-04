import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationSite } from './_index';

/**
 * 銷售紀錄
 */
export interface IReportSalesRecord {
    /**
     * 地區
     */
    site: LocationSite;

    /**
     * 日期
     */
    date: Date;

    /**
     * 收入
     */
    revenue: number;

    /**
     * 交易
     */
    transaction: number;
}

@registerSubclass()
export class ReportSalesRecord extends ParseObjectNotice<IReportSalesRecord> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'ReportSalesRecord');
}

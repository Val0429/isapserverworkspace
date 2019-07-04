import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IDateRange, IDaySingle, LocationSite, Tag } from './_index';
import * as Enum from '../../enums';

/**
 * 報表模板
 */
export interface IReportTemplate extends IDateRange {
    /**
     * User
     */
    user: Parse.User;

    /**
     * 名稱
     */
    name: string;

    /**
     * 報表模式
     */
    mode: Enum.EDeviceMode;

    /**
     * 總結模式
     */
    type: Enum.ESummaryType;

    /**
     * 地區
     */
    sites: LocationSite[];

    /**
     * 標籤
     */
    tags: Tag[];

    /**
     * 寄信時間
     */
    sendDates: IDaySingle[];

    /**
     * 寄信對象
     */
    sendUsers: Parse.User[];
}

@registerSubclass()
export class ReportTemplate extends ParseObjectNotice<IReportTemplate> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'ReportTemplate');
}

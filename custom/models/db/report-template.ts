import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationSite, Tag } from './_index';
import * as Enum from '../../enums';
import { IDate, IDay } from '../base/_index';

/**
 * 報表模板
 */
export interface IReportTemplate extends IDate.IRange {
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
    type: Enum.EDatePeriodType;

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
    sendDates: IDay.ISingle[];

    /**
     * 寄信對象
     */
    sendUsers: Parse.User[];
}

@registerSubclass()
export class ReportTemplate extends ParseObjectNotice<IReportTemplate> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'ReportTemplate');
}

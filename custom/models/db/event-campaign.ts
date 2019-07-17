import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IDateRange, LocationSite } from './_index';

/**
 * 事件活動
 */
export interface IEventCampaign extends IDateRange {
    /**
     * 名稱
     */
    name: string;

    /**
     * 類型
     */
    type: string;

    /**
     * 年度
     */
    year: number;

    /**
     * 預算
     */
    budget: number;

    /**
     * 說明
     */
    description: string;

    /**
     * Site
     */
    sites: LocationSite[];
}

@registerSubclass()
export class EventCampaign extends ParseObjectNotice<IEventCampaign> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'EventCampaign');
}

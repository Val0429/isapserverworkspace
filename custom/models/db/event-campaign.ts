import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IDateRange, LocationSite } from './_index';

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
export class EventCampaign extends ParseObject<IEventCampaign> {}

import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IDateRange } from './';

/**
 * 行事曆
 */
export interface IPublicCalendar {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 公告時間
     */
    date: IDateRange;

    /**
     * 主旨
     */
    title: string;

    /**
     * 內容
     */
    content: string;
}

@registerSubclass()
export class PublicCalendar extends ParseObject<IPublicCalendar> {}

import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IDateRange } from './';
import * as Enum from '../enums';

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

    /**
     * 投票範圍
     */
    aims: Enum.ResidentCharacter[];
}

@registerSubclass()
export class PublicCalendar extends ParseObject<IPublicCalendar> {}

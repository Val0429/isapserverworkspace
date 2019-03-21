import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Community, IDateRange } from './_index';
import * as Enum from '../../enums';

/**
 * 行事曆
 */
export interface IPublicCalendar {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 社區
     */
    community: Community;

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

    /**
     * 刪除
     */
    isDeleted: boolean;
}

@registerSubclass()
export class PublicCalendar extends ParseObject<IPublicCalendar> {}

import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Enum from '../enums';
import { Community, PublicArticle, CharacterResident } from './';

/**
 * 物品借用
 */
export interface IPublicArticleReservation {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 社區
     */
    community: Community;

    /**
     * 物品
     */
    article: PublicArticle;

    /**
     * 住戶
     */
    resident: CharacterResident;

    /**
     * 借出數量
     */
    lendCount: number;

    /**
     * 回復日期
     */
    replyDate: Date;

    /**
     * 回復人
     */
    replier: Parse.User;

    /**
     * 狀態
     */
    status: Enum.ReceiveStatus;

    /**
     * 刪除
     */
    isDeleted: boolean;
}

@registerSubclass()
export class PublicArticleReservation extends ParseObject<IPublicArticleReservation> {}

import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Enum from '../enums';
import { PublicArticle, CharacterResident } from './';

/**
 * 物品借用
 */
export interface IPublicArticleReservation {
    /**
     * 創造人
     */
    creator: Parse.User;

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
     * 狀態
     */
    status: Enum.ReceiveStatus;
}

@registerSubclass()
export class PublicArticleReservation extends ParseObject<IPublicArticleReservation> {}

import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/**
 * 物品
 */
export interface IPublicArticle {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 名稱
     */
    name: string;

    /**
     * 種類
     */
    type: string;

    /**
     * 預設數量
     */
    defaultCount: number;

    /**
     * 調整數量
     */
    adjustCount: number;

    /**
     * 調整原因
     */
    adjustReason: string;

    /**
     * 調整人
     */
    adjuster: Parse.User;

    /**
     * 借出數量
     */
    lendCount: number;
}

@registerSubclass()
export class PublicArticle extends ParseObject<IPublicArticle> {}

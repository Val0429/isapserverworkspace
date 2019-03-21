import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Community, CharacterResident } from './_index';

/**
 * 訪客
 */
export interface IVisitor {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 社區
     */
    community: Community;

    /**
     * 住戶
     */
    resident: CharacterResident;

    /**
     * 訪客名
     */
    name: string;

    /**
     * 訪客照片
     */
    visitorSrc: string;

    /**
     * 人數
     */
    count: number;

    /**
     * 目的
     */
    purpose: string;

    /**
     * 備註
     */
    memo: string;

    /**
     * 通知次數
     */
    notificateCount: number;

    /**
     * 刪除
     */
    isDeleted: boolean;
}

@registerSubclass()
export class Visitor extends ParseObject<IVisitor> {}

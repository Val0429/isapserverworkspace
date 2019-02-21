import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Enum from '../enums';
import { CharacterResident } from './';

/**
 * 聯絡管委會
 */
export interface IListen {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 住戶
     */
    resident: CharacterResident;

    /**
     * 主旨
     */
    title: string;

    /**
     * 內容
     */
    content: string;

    /**
     * 回復人
     */
    replier: Parse.User;

    /**
     * 回復內容
     */
    replyContent: string;

    /**
     * 回復日期
     */
    replyDate: Date;

    /**
     * 狀態
     */
    status: Enum.ReceiveStatus;

    /**
     * 附件
     */
    attachmentSrcs: string[];
}

@registerSubclass()
export class Listen extends ParseObject<IListen> {}

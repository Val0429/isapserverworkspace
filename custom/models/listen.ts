import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Enum from '../enums';
import { Community, CharacterResident } from './';

interface IReply {
    /**
     * 回復人
     */
    replier: Parse.User;

    /**
     * 內容
     */
    content: string;

    /**
     * 日期
     */
    date: Date;
}

/**
 * 聯絡管委會
 */
export interface IListen {
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
     * 主旨
     */
    title: string;

    /**
     * 內容
     */
    content: string;

    /**
     * 回復
     */
    replys: IReply[];

    /**
     * 狀態
     */
    status: Enum.ReceiveStatus;

    /**
     * 附件
     */
    attachmentSrc: string;
}

@registerSubclass()
export class Listen extends ParseObject<IListen> {}

import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Enum from '../enums';

/**
 * 公告
 */
export interface IPublicNotify {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 公告時間
     */
    date: Date;

    /**
     * 主旨
     */
    title: string;

    /**
     * 內容
     */
    content: string;

    /**
     * 附件
     */
    attachmentSrc: string;

    /**
     * 投票範圍
     */
    aims: Enum.ResidentCharacter[];
}

@registerSubclass()
export class PublicNotify extends ParseObject<IPublicNotify> {}

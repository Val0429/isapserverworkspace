import { Community, CharacterResident } from './_index';
import * as Enum from '../../enums';

/**
 * 郵件
 */
export interface IPackageBase {
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
     * 寄件人
     */
    sender: string;

    /**
     * 收件人
     */
    receiver: string;

    /**
     * 狀態
     */
    status: Enum.ReceiveStatus;

    /**
     * 備註
     */
    memo: string;

    /**
     * 通知次數
     */
    notificateCount: number;

    /**
     * 調整原因
     */
    adjustReason: string;

    /**
     * 經辦人
     */
    manager: Parse.User;
}

import * as Enum from '../enums';
import { CharacterResident } from '.';

/**
 * 郵件
 */
export interface IPackageBase {
    /**
     * 創造人
     */
    creator: Parse.User;

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
}

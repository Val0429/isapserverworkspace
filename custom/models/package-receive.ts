import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Enum from '../enums';
import { CharacterResident } from '.';

/**
 * 郵件
 */
export interface IPackageReceive {
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
     * 條碼
     */
    barcode: string;

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

@registerSubclass()
export class PackageReceive extends ParseObject<IPackageReceive> {}

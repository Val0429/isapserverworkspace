import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Community, CharacterResident } from './_index';
import * as Enum from '../../enums';

/**
 * 管理費
 */
export interface IManageCost {
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
     * 月份
     */
    date: Date;

    /**
     * 截止日
     */
    deadline: Date;

    /**
     * 狀態
     */
    status: Enum.ReceiveStatus;

    /**
     * 停車費
     */
    parkingCost: number;

    /**
     * 住戶管理費
     */
    manageCost: number;

    /**
     * 剩餘金額
     */
    balance: number;

    /**
     * 收費人
     */
    charger: Parse.User;

    /**
     * 序號
     */
    serial: number;
}

@registerSubclass()
export class ManageCost extends ParseObject<IManageCost> {}

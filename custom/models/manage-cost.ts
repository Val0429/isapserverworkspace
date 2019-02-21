import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Enum from '../enums';
import { CharacterResident } from '.';

/**
 * 管理費
 */
export interface IManageCost {
    /**
     * 創造人
     */
    creator: Parse.User;

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
     * 總金額
     */
    total: number;

    /**
     * 已繳金額
     */
    balance: number;
}

@registerSubclass()
export class ManageCost extends ParseObject<IManageCost> {}

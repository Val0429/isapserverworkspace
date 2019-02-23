import { registerSubclass, ParseObject } from '../../../helpers/parse-server/parse-helper';
import * as Enum from '../enums';

/**
 * 住戶
 */
export interface ICharacterResident {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 地址
     */
    address: string;

    /**
     * 住戶管理費
     */
    manageCost: number;

    /**
     * 每月點數
     */
    pointTotal: number;

    /**
     * 點數餘額
     */
    pointBalance: number;

    /**
     * 點數更新時間
     */
    pointUpdateDate: Date;

    /**
     * 角色
     */
    character: Enum.ResidentCharacter;

    /**
     * 條碼
     */
    barcode: string;
}

@registerSubclass()
export class CharacterResident extends ParseObject<ICharacterResident> {}

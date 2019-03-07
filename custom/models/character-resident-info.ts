import { registerSubclass, ParseObject } from '../../../helpers/parse-server/parse-helper';
import * as Enum from '../enums';
import { CharacterResident } from '.';

/**
 * 住戶訊息
 */
export interface ICharacterResidentInfo {
    /**
     * 使用者
     */
    user: Parse.User;

    /**
     * 住戶
     */
    resident: CharacterResident;

    /**
     *  姓名
     */
    name: string;

    /**
     * 性別
     */
    gender: Enum.Gender;

    /**
     * 生日
     */
    birthday: Date;

    /**
     * 手機號碼
     */
    phone: string;

    /**
     * Line ID
     */
    lineId: string;

    /**
     * 電子郵件
     */
    email: string;

    /**
     * 學歷
     */
    education: string;

    /**
     * 職業
     */
    career: string;

    /**
     * 角色
     */
    character: Enum.ResidentCharacter;
}

@registerSubclass()
export class CharacterResidentInfo extends ParseObject<ICharacterResidentInfo> {}

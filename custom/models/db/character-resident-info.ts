import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Community, CharacterResident } from './_index';
import * as Enum from '../../enums';

/**
 * 住戶訊息
 */
export interface ICharacterResidentInfo {
    /**
     * 使用者
     */
    user: Parse.User;

    /**
     * 社區
     */
    community: Community;

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

    /**
     * 裝置類型
     */
    deviceType: 'android' | 'ios';

    /**
     * 裝置令牌
     */
    deviceToken: string;

    /**
     * Email開關
     */
    isEmail: boolean;

    /**
     * 推播開關
     */
    isNotice: boolean;

    /**
     * 刪除
     */
    isDeleted: boolean;
}

@registerSubclass()
export class CharacterResidentInfo extends ParseObject<ICharacterResidentInfo> {}

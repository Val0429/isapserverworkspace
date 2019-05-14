import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Enum from '../../enums';

/**
 * 帳號資料
 */
export interface IUserInfo {
    /**
     * 使用者
     */
    user: Parse.User;

    /**
     * 名字
     */
    name: string;

    /**
     * Email
     */
    email: string;

    /**
     * 電話
     */
    phone: string;
}

@registerSubclass()
export class UserInfo extends ParseObject<IUserInfo> {}

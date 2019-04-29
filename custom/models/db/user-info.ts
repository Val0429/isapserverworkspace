import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IBase } from './_index';

/**
 * 帳號資料
 */
export interface IUserInfo extends IBase {
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

import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IBase } from './_index';

export interface IUserInfo extends IBase {
    /**
     * 使用者
     */
    user: Parse.User;

    /**
     * 名字
     */
    name: string;
}

@registerSubclass()
export class UserInfo extends ParseObject<IUserInfo> {}

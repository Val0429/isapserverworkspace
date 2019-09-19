import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationCompanies, LocationFloors } from './_index';
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
     * Role
     */
    roles: Parse.Role[];

    /**
     * 帳號
     */
    account: string;

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
    phone?: string;

    /**
     * 職稱
     */
    position?: string;

    /**
     * 備註
     */
    remark?: string;

    /**
     *
     */
    company?: LocationCompanies;

    /**
     *
     */
    floors?: LocationFloors[];

    /**
     * 手機類型
     */
    mobileType?: Enum.EMobileType;

    /**
     * 手機令牌
     */
    mobileToken?: string;

    /**
     * Web 最後使用時間
     */
    webLestUseDate?: Date;

    /**
     * App 最後使用時間
     */
    appLastUseDate?: Date;

    /**
     * Forget password verification
     */
    forgetVerification?: string;

    /**
     * Forget passowrd expitre date
     */
    forgetExpireDate?: Date;
}

@registerSubclass()
export class UserInfo extends ParseObjectNotice<IUserInfo> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'UserInfo');
}

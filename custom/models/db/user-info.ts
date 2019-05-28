import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { LocationSite, UserGroup } from './_index';
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
     * Custom id
     */
    customId: string;

    /**
     * Email
     */
    email: string;

    /**
     * 電話
     */
    phone?: string;

    /**
     * 手機類型
     */
    mobileType: Enum.EMobileType;

    /**
     * 手機令牌
     */
    mobileToken: string;

    /**
     * Email開關
     */
    isEmail: boolean;

    /**
     * 簡訊開關
     */
    isPhone: boolean;

    /**
     * 推播開關
     */
    isNotice: boolean;

    /**
     * Web 最後使用時間
     */
    webLestUseDate?: Date;

    /**
     * App 最後使用時間
     */
    appLastUseDate?: Date;

    /**
     * Managed sites
     */
    sites: LocationSite[];

    /**
     * User groups
     */
    groups: UserGroup[];
}

@registerSubclass()
export class UserInfo extends ParseObject<IUserInfo> {}

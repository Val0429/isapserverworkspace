import { LocationSite, LocationArea, DeviceGroup, Device, UserGroup } from './_index';
import { IDate } from '../base/_index';

/**
 * 通知方式
 */
export interface IRuleBaseNotifyMethod {
    /**
     * 使用手機推播
     */
    isPushNotification: boolean;

    /**
     * 使用簡訊
     */
    isTextMessage: boolean;

    /**
     * 使用電子郵件
     */
    isEmail: boolean;
}

/**
 * 通知對象
 */
export interface IRuleBaseNotifyObject {
    /**
     * Site 管理人
     */
    isSiteManager: boolean;

    /**
     * Site 有權限的人
     */
    isSitePermission: boolean;

    /**
     * 用戶
     */
    users: Parse.User[];

    /**
     * 用戶群組
     */
    userGroups: UserGroup[];
}

/**
 * Rule and Action
 */
export interface IRuleBase {
    /**
     * 名稱
     */
    name: string;

    /**
     * 啟用?
     */
    isEnable: boolean;

    /**
     * 執行時間
     */
    runTime: false | IDate.IRange;

    /**
     *
     */
    sites?: LocationSite[];

    /**
     *
     */
    areas?: LocationArea[];

    /**
     *
     */
    deviceGroups?: DeviceGroup[];

    /**
     *
     */
    devices?: Device[];

    /**
     * 通知方式
     */
    notifyMethod: IRuleBaseNotifyMethod;

    /**
     * 通知對象
     */
    notifyObject: IRuleBaseNotifyObject;

    /**
     * 通知鎖定時間
     */
    notifyLockMinute: number;
}

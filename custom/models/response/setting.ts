import { ISettingPushNotification, ISettingSystem } from '../db/_index';

/**
 * Push Notification
 */
export interface IPushNotificationR extends ISettingPushNotification {}

/**
 * System
 */
export interface ISystemR extends ISettingSystem {}

/**
 * SgSMS
 */
export interface ISgsmsR {
    enable: boolean;
    url: string;
    account: string;
    password: string;
}

/**
 * SMTP
 */
export interface ISmtpR {
    enable: boolean;
    host: string;
    port: number;
    email: string;
    password: string;
}

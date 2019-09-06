import { ISettingPushNotification, ISettingSystem } from '../db/_index';

/**
 * Push Notification
 */
export interface IPushNotificationU extends ISettingPushNotification {}

/**
 * System
 */
export interface ISystemU extends ISettingSystem {}

/**
 * SgSMS
 */
export interface ISgsms_Config {
    url: string;
    account: string;
    password: string;
}

export interface ISgsmsU extends ISgsms_Config {
    enable: boolean;
}

export interface ISgsmsTest {
    config?: ISgsms_Config;
    phone: string;
}

/**
 * SMTP
 */
export interface ISmtp_Config {
    host: string;
    port: number;
    email: string;
    password: string;
}

export interface ISmtpU extends ISmtp_Config {
    enable: boolean;
}

export interface ISmtpTest {
    config?: ISmtp_Config;
    email: string;
}

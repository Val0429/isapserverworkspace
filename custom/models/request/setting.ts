import { ISettingPushNotification, ISettingSystem } from '../db/_index';

export interface IPushNotificationU extends ISettingPushNotification {}

export interface ISystemU extends ISettingSystem {}

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

export interface IWeather_Config {
    secretKey: string;
}

export interface IWeatherU extends IWeather_Config {}

export interface IWeatherTest {
    config?: IWeather_Config;
    longitude: number;
    latitude: number;
}

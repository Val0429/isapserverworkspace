import { ISettingPushNotification, ISettingSystem } from '../db/_index';
import { Weather } from '../../helpers';

export interface IPushNotificationR extends ISettingPushNotification {}

export interface ISystemR extends ISettingSystem {}

export interface ISgsmsR {
    enable: boolean;
    url: string;
    account: string;
    password: string;
}

export interface ISmtpR {
    enable: boolean;
    host: string;
    port: number;
    email: string;
    password: string;
}

export interface IWeatherR {
    secretKey: string;
}

export interface IWeatherTest extends Weather.Darksky.IForecast {}

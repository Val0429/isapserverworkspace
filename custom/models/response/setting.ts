import { Weather } from '../../helpers';
    protocol: 'http' | 'https';
    ip: string;
    port: number;
}

export interface IHumanDetectionTest {
    imageBase64: string;
}

export interface IPushNotificationR {
    enable: boolean;
}

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

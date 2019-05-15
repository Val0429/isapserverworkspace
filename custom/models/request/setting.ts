export interface IHumanDetectionU {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
}

export interface IHumanDetectionTest {
    imageBase64: string;
}

export interface IPushNotificationU {
    enable: boolean;
}

export interface ISgsmsU {
    enable: boolean;
    url: string;
    account: string;
    password: string;
}

export interface ISgsmsTest {
    phone: string;
}

export interface ISmtpU {
    enable: boolean;
    host: string;
    port: number;
    email: string;
    password: string;
}

export interface ISmtpTest {
    email: string;
}

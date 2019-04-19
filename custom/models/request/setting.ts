export interface ICMSU {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

export interface ICMSCheck extends ICMSU {}

export interface IHumanDetectionU {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
}

export interface IHumanDetectionCheck extends IHumanDetectionU {
    imageBase64: string;
}

export interface ISgsmsU {
    enable: boolean;
    url: string;
    username: string;
    password: string;
}

export interface ISgsmsCheck {
    phone: string;
}

export interface ISmtpU {
    enable: boolean;
    host: string;
    port: number;
    email: string;
    password: string;
}

export interface ISmtpCheck {
    email: string;
}

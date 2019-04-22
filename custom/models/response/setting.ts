export interface ICMSR {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

export interface IHumanDetectionR {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
}

export interface IHumanDetectionCheck {
    imageBase64: string;
}

export interface ISgsmsR {
    enable: boolean;
    url: string;
    username: string;
    password: string;
}

export interface ISmtpR {
    enable: boolean;
    host: string;
    port: number;
    email: string;
    password: string;
}

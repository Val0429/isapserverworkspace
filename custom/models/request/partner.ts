export interface ICMSBase {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

export interface ICMSC extends ICMSBase {
    name: string;
}

export interface ICMSU extends ICMSBase {
    objectId: string;
    name?: string;
}

export interface IFRSBase {
    analysis: {
        ip: string;
        port: number;
        wsport: number;
        account: string;
        password: string;
    };
    manage: {
        protocol: 'http' | 'https';
        ip: string;
        port: number;
        account: string;
        password: string;
    };
}

export interface IFRSC extends IFRSBase {
    name: string;
}

export interface IFRSU extends IFRSBase {
    objectId: string;
    name?: string;
}

export interface IHumanDetectionBase {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    target_score: number;
}

export interface IHumanDetectionC extends IHumanDetectionBase {
    name: string;
}

export interface IHumanDetectionU extends IHumanDetectionBase {
    objectId: string;
    name?: string;
}

export interface IHumanDetectionTest {
    objectId?: string;
    config?: IHumanDetectionC;
    imageBase64: string;
}

export interface IDemographicBase {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    margin: number;
}

export interface IDemographicC extends IDemographicBase {
    name: string;
}

export interface IDemographicU extends IDemographicBase {
    objectId: string;
    name?: string;
}

export interface IDemographicTest {
    objectId?: string;
    config?: IDemographicC;
    imageBase64: string;
}

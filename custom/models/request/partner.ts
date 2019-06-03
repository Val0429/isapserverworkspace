export interface ICMSC {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

export interface ICMSU extends ICMSC {
    objectId: string;
}

export interface IFRSC {
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

export interface IFRSU extends IFRSC {
    objectId: string;
}

export interface IHumanDetectionC {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    target_score: number;
}

export interface IHumanDetectionU extends IHumanDetectionC {
    objectId: string;
}

export interface IHumanDetectionTest {
    objectId?: string;
    config?: IHumanDetectionC;
    imageBase64: string;
}

export interface IDemographicC {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    margin: number;
}

export interface IDemographicU extends IDemographicC {
    objectId: string;
}

export interface IDemographicTest {
    objectId?: string;
    config?: IDemographicC;
    imageBase64: string;
}

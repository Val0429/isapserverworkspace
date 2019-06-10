export interface ICMSBase {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

export interface ICMSC extends ICMSBase {
    customId: string;
    name: string;
}

export interface ICMSU extends ICMSBase {
    objectId: string;
    name?: string;
}

export interface ICMSDevice {
    objectId?: string;
    config?: ICMSBase;
}

export interface IFRSBase {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    wsport: number;
    account: string;
    password: string;
}

export interface IFRSC extends IFRSBase {
    customId: string;
    name: string;
}

export interface IFRSU extends IFRSBase {
    objectId: string;
    name?: string;
}

export interface IFRSDevice {
    objectId?: string;
    config?: IFRSBase;
}

export interface IHumanDetectionBase {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    target_score: number;
}

export interface IHumanDetectionC extends IHumanDetectionBase {
    customId: string;
    name: string;
}

export interface IHumanDetectionU extends IHumanDetectionBase {
    objectId: string;
    name?: string;
}

export interface IHumanDetectionTest {
    objectId?: string;
    config?: IHumanDetectionBase;
    imageBase64: string;
}

export interface IDemographicBase {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    margin: number;
}

export interface IDemographicC extends IDemographicBase {
    customId: string;
    name: string;
}

export interface IDemographicU extends IDemographicBase {
    objectId: string;
    name?: string;
}

export interface IDemographicTest {
    objectId?: string;
    config?: IDemographicBase;
    imageBase64: string;
}

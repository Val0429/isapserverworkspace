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

export interface ICMSDevice_ObjectId {
    objectId: string;
}

export interface ICMSDevice_Config {
    config: ICMSBase;
}

export interface ICMSSnapshot_Base {
    nvrId: number;
    channelId: number;
}

export interface ICMSSnapshot_ObjectId extends ICMSSnapshot_Base {
    objectId: string;
}

export interface ICMSSnapshot_Config extends ICMSSnapshot_Base {
    config: ICMSBase;
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

export interface IFRSDevice_ObjectId {
    objectId: string;
}

export interface IFRSDevice_Config {
    config: IFRSBase;
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

export interface IHumanDetectionTest_Base {
    imageBase64: string;
}

export interface IHumanDetectionTest_ObjectId extends IHumanDetectionTest_Base {
    objectId: string;
}

export interface IHumanDetectionTest_Config extends IHumanDetectionTest_Base {
    config: IHumanDetectionBase;
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

export interface IDemographicTest_Base {
    imageBase64: string;
}

export interface IDemographicTest_ObjectId extends IDemographicTest_Base {
    objectId: string;
}

export interface IDemographicTest_Config extends IDemographicTest_Base {
    config: IDemographicBase;
}

import { IRequest } from '../request';

export interface ICMSR extends IRequest.IPartner.ICMSC {
    objectId: string;
}

export interface ICMSSnapshot {
    cameraWidth: number;
    cameraHeight: number;
    snapshotBase64: string;
}

export interface IFRSR extends IRequest.IPartner.IFRSC {
    objectId: string;
}

export interface IHumanDetectionR extends IRequest.IPartner.IHumanDetectionC {
    objectId: string;
}

export interface IHumanDetectionTest {
    imageBase64: string;
}

export interface IDemographicR extends IRequest.IPartner.IDemographicC {
    objectId: string;
}

export interface IDemographicTest {
    age: number;
    gender: string;
    imageBase64: string;
}

export interface IFRSManagerR extends IRequest.IPartner.IFRSManagerC {
    objectId: string;
}

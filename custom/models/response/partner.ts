import { IRequest } from '../request';

export interface ICMSR extends IRequest.IPartner.ICMSC {
    objectId: string;
}

export interface ICMSSnapshot {
    cameraWidth: number;
    cameraHeight: number;
    snapshotBase64: string;
}

export interface IServerFRSUserGroup {
    type: string;
    objectId: string;
    name: string;
}

export interface IFRSR extends IRequest.IPartner.IFRSBase {
    objectId: string;
    customId: string;
    name: string;
    userGroups: IServerFRSUserGroup[];
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

export interface IFRSManagerR extends IRequest.IPartner.IFRSManagerBase {
    objectId: string;
    customId: string;
    name: string;
    userGroups: IServerFRSUserGroup[];
}

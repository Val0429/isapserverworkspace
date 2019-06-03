import { IRequest } from '../request';

export interface ICMSR extends IRequest.IPartner.ICMSU {}

export interface IFRSR extends IRequest.IPartner.IFRSU {}

export interface IHumanDetectionR extends IRequest.IPartner.IHumanDetectionU {}

export interface IHumanDetectionTest {
    imageBase64: string;
}

export interface IDemographicR extends IRequest.IPartner.IDemographicU {}

export interface IDemographicTest {
    age: number;
    gender: string;
    imageBase64: string;
}

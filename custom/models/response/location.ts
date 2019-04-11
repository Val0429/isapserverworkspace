import { IConfigHanwha, IAction } from '../db/_index';
import * as Enum from '../../enums';

export interface IRegionIndexC {
    regionId: string;
}

export interface IRegionIndexR {
    regionId: string;
    name: string;
    longitude: number;
    latitude: number;
    imageSrc: string;
    imageWidth: number;
    imageHeight: number;
}

export interface ISiteIndexC {
    siteId: string;
}

export interface ISiteIndexR {
    regionId: string;
    siteId: string;
    name: string;
    longitude: number;
    latitude: number;
    iconSrc: string;
    iconWidth: number;
    iconHeight: number;
    x: number;
    y: number;
    imageSrc: string;
    imageWidth: number;
    imageHeight: number;
    nvrConfig: IConfigHanwha;
    action: IAction;
}

export interface ISiteAll {
    regionId: string;
    siteId: string;
    name: string;
}

export interface IDeviceIndexC {
    deviceId: string;
}

export interface IDeviceIndexR {
    siteId: string;
    deviceId: string;
    type: Enum.DeviceType;
    cameraId: string;
    name: string;
    iconSrc: string;
    iconWidth: number;
    iconHeight: number;
    x: number;
    y: number;
    angle: number;
    visibleDistance: number;
    visibleAngle: number;
}

export interface IDeviceAll {
    siteId: string;
    deviceId: string;
    name: string;
}

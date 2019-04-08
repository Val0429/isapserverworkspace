import { IConfigHanwha, IAction } from '../db/_index';
import * as Enum from '../../enums';

export interface IRegionIndexC {
    name: string;
    longitude?: number;
    latitude?: number;
    imageBase64: string;
    imageWidth: number;
    imageHeight: number;
}

export interface IRegionIndexU {
    regionId: string;
    name?: string;
    longitude?: number;
    latitude?: number;
    imageBase64?: string;
    imageWidth?: number;
    imageHeight?: number;
}

export interface IRegionIndexD {
    regionIds: string | string[];
}

export interface ISiteIndexC {
    regionId: string;
    name: string;
    iconBase64: string;
    iconWidth: number;
    iconHeight: number;
    x: number;
    y: number;
    imageBase64: string;
    imageWidth: number;
    imageHeight: number;
    nvrConfig: IConfigHanwha;
    action: IAction;
}

export interface ISiteIndexR {
    regionId?: string;
}

export interface ISiteIndexU {
    siteId: string;
    name?: string;
    iconBase64?: string;
    iconWidth?: number;
    iconHeight?: number;
    x?: number;
    y?: number;
    imageBase64?: string;
    imageWidth?: number;
    imageHeight?: number;
    nvrConfig?: IConfigHanwha;
    action?: IAction;
}

export interface ISiteIndexD {
    siteIds: string | string[];
}

export interface IDeviceIndexC {
    siteId: string;
    type: Enum.DeviceType;
    cameraId?: string;
    name: string;
    iconBase64: string;
    iconWidth: number;
    iconHeight: number;
    x: number;
    y: number;
    angle?: number;
    visibleDistance?: number;
    visibleAngle?: number;
}

export interface IDeviceIndexR {
    siteId?: string;
}

export interface IDeviceIndexU {
    deviceId: string;
    type?: Enum.DeviceType;
    cameraId?: string;
    name?: string;
    iconBase64?: string;
    iconWidth?: number;
    iconHeight?: number;
    x?: number;
    y?: number;
    angle?: number;
    visibleDistance?: number;
    visibleAngle?: number;
}

export interface IDeviceIndexD {
    deviceIds: string | string[];
}

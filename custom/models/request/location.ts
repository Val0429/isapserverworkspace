import { IAction } from '../db/_index';
import * as Enum from '../../enums';

export interface IFloorC {
    name: string;
    floorNo: number;
    imageBase64: string;
    imageWidth: number;
    imageHeight: number;
}

export interface IFloorU {
    objectId: string;
    name?: string;
    floorNo?: number;
    imageBase64?: string;
    imageWidth?: number;
    imageHeight?: number;
}

export interface IFloorD {
    objectId: string;
}

export interface IAreaC {
    floorId: string;
    name: string;
    action: IAction;
}

export interface IAreaR {
    floorId?: string;
}

export interface IAreaU {
    objectId: string;
    name?: string;
    action?: IAction;
}

export interface IAreaD {
    objectId: string;
}

export interface IDeviceC {
    areaId: string;
    type: Enum.EDeviceType;
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

export interface IDeviceR {
    floorId?: string;
    areaId?: string;
}

export interface IDeviceU {
    objectId: string;
    areaId?: string;
    type?: Enum.EDeviceType;
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

export interface IDeviceD {
    objectId: string;
}

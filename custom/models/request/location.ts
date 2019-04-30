import { IAction } from '../db/_index';
import * as Enum from '../../enums';

export interface IFloorC {
    name: string;
    floorNo: number;
    imageBase64: string;
    imageWidth: number;
    imageHeight: number;
    dataWindowX: number;
    dataWindowY: number;
}

export interface IFloorU {
    objectId: string;
    name?: string;
    floorNo?: number;
    imageBase64?: string;
    imageWidth?: number;
    imageHeight?: number;
    dataWindowX?: number;
    dataWindowY?: number;
}

export interface IFloorD {
    objectId: string;
}

export interface IDeviceC {
    floorId: string;
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
    dataWindowX: number;
    dataWindowY: number;
    action: IAction;
}

export interface IDeviceR {
    floorId?: string;
}

export interface IDeviceU {
    objectId: string;
    floorId?: string;
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
    dataWindowX?: number;
    dataWindowY?: number;
    action?: IAction;
}

export interface IDeviceD {
    objectId: string;
}

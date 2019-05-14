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
    dataWindowPcX: number;
    dataWindowPcY: number;
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
    dataWindowPcX?: number;
    dataWindowPcY?: number;
}

export interface IFloorD {
    objectId: string;
}

export interface IAreaC {
    floorId: string;
    mode: Enum.ECameraMode;
    name: string;
    action: IAction;
    dataWindowX: number;
    dataWindowY: number;
}

export interface IAreaR {
    floorId?: string;
    mode?: Enum.ECameraMode;
}

export interface IAreaU {
    objectId: string;
    name?: string;
    action?: IAction;
    dataWindowX?: number;
    dataWindowY?: number;
}

export interface IAreaD {
    objectId: string;
}

export interface IDeviceC {
    areaId: string;
    type: Enum.EDeviceType;
    cameraId?: string;
    name: string;
    x: number;
    y: number;
    angle?: number;
    visibleDistance?: number;
    visibleAngle?: number;
}

export interface IDeviceR {
    floorId?: string;
    areaId?: string;
    mode?: Enum.ECameraMode;
}

export interface IDeviceU {
    objectId: string;
    areaId?: string;
    type?: Enum.EDeviceType;
    cameraId?: string;
    name?: string;
    x?: number;
    y?: number;
    angle?: number;
    visibleDistance?: number;
    visibleAngle?: number;
}

export interface IDeviceD {
    objectId: string;
}

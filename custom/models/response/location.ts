import { IAction } from '../db/_index';
import * as Enum from '../../enums';

export interface IFloorC {
    objectId: string;
}

export interface IFloorR {
    objectId: string;
    name: string;
    floorNo: number;
    imageSrc: string;
    imageWidth: number;
    imageHeight: number;
    dataWindowX: number;
    dataWindowY: number;
    dataWindowPcX: number;
    dataWindowPcY: number;
}

export interface IAreaC {
    objectId: string;
}

export interface IAreaR {
    objectId: string;
    floorId: string;
    mode: string;
    name: string;
    action: IAction;
    dataWindowX: number;
    dataWindowY: number;
}

export interface IDeviceC {
    objectId: string;
}

export interface IDeviceR {
    objectId: string;
    floorId: string;
    areaId: string;
    type: Enum.EDeviceType;
    mode: string;
    cameraId: string;
    name: string;
    x: number;
    y: number;
    angle: number;
    visibleDistance: number;
    visibleAngle: number;
}

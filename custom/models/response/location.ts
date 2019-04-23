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
}

export interface IAreaC {
    objectId: string;
}

export interface IAreaR {
    objectId: string;
    floorId: string;
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

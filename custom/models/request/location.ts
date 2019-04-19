import { IAction } from '../db/_index';

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
    action: IAction;
}

export interface IAreaR {
    floorId?: string;
}

export interface IAreaU {
    objectId: string;
    action?: IAction;
}

export interface IAreaD {
    objectId: string;
}

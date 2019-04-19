import { IAction } from '../db/_index';

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
}

export interface IAreaC {
    objectId: string;
}

export interface IAreaR {
    objectId: string;
    floorId: string;
    name: string;
    action: IAction;
}

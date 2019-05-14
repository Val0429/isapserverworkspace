import * as Enum from '../../enums';

export interface IIndexC {
    parentId?: string;
    name: string;
    level: Enum.ELocationLevel;
    no: number;
    imageBase64: string;
    imageWidth: number;
    imageHeight: number;
    longitude: number;
    latitude: number;
    x: number;
    y: number;
    dataWindowX: number;
    dataWindowY: number;
}

export interface IIndexR {
    parentId?: string;
    level?: Enum.ELocationLevel;
}

export interface IIndexU {
    objectId: string;
    name?: string;
    level?: Enum.ELocationLevel;
    no?: number;
    imageBase64?: string;
    imageWidth?: number;
    imageHeight?: number;
    longitude?: number;
    latitude?: number;
    x?: number;
    y?: number;
    dataWindowX?: number;
    dataWindowY?: number;
}

export interface IIndexD {
    objectId: string;
}

import * as Enum from '../../enums';

export interface IMapIndexC {
    parentId?: string;
    name: string;
    level: Enum.ELocationLevel;
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

export interface IMapIndexR {
    parentId?: string;
    level?: Enum.ELocationLevel;
}

export interface IMapIndexU {
    objectId: string;
    name?: string;
    level?: Enum.ELocationLevel;
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

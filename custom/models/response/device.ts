import { IObject } from './_index';
import { Draw } from '../../helpers';
import { ICameraHanwha } from '../db/_index';

export interface IGroupIndexR_Device {
    mode: string;
    count: number;
}

export interface IGroupIndexR {
    objectId: string;
    site: IObject;
    area: IObject;
    mode: string;
    name: string;
    devices: IGroupIndexR_Device[];
}

export interface IGroupAll {
    objectId: string;
    mode: string;
    name: string;
}

export interface ICameraFRS {
    server: IObject;
    sourceid: string;
    location: string;
}

export interface ICameraCMS {
    server: IObject;
    nvrId: number;
    channelId: number;
}

export interface IIndexR {
    objectId: string;
    customId: string;
    site: IObject;
    area: IObject;
    groups: IObject[];
    name: string;
    brand: string;
    model: string;
    mode: string;
    config: ICameraCMS | ICameraFRS | ICameraHanwha;
    demoServer: IObject;
    hdServer: IObject;
    direction: string;
    rois: Draw.ILocation[];
    x: number;
    y: number;
    angle: number;
    visibleDistance: number;
    visibleAngle: number;
    dataWindowX: number;
    dataWindowY: number;
}

import { IObject } from './_index';
import { Draw } from '../../helpers';
import { ICameraHanwha, IThreshold } from '../db/_index';

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
    threshold: IThreshold;
}

export interface IGroupAll {
    objectId: string;
    mode: string;
    name: string;
}

export interface ICameraFRSManager {
    server: IObject;
    frsId: string;
    sourceId: string;
}

export interface ICameraFRS {
    server: IObject;
    sourceid: string;
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
    config: ICameraCMS | ICameraFRSManager | ICameraFRS | ICameraHanwha;
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

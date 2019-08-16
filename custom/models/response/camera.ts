import { Draw } from '../../helpers';
import { IConfigEocorpexCamera } from '../db/_index';

export interface IAll {
    objectId: string;
    name: string;
}

export interface ILocation {
    objectId: string;
    name: string;
    floorId: string;
    floorName: string;
    floorNo: number;
    areaId: string;
    areaName: string;
    deviceId: string;
    deviceName: string;
}

export interface IIndexR {
    objectId: string;
    name: string;
    rois: Draw.ILocation[];
    cameraWidth: number;
    cameraHeight: number;
    snapshotBase64: string;
}

export interface IPcCameraIndexR {
    objectId: string;
    name: string;
    mode: string;
    type: string;
    config: any;
}

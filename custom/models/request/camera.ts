import { Draw } from '../../helpers';
import * as Enum from '../../enums';
import { IConfigDahuaCamera } from '../db/_index';

export interface IIndexR {
    objectId: string;
}

export interface IIndexU {
    objectId: string;
    rois: Draw.ILocation[];
}

export interface IAll {
    mode?: Enum.ECameraMode;
}

export interface ILocation {
    type?: 'all' | 'inMap' | 'outMap';
    mode?: Enum.ECameraMode;
}

export interface IPcCameraIndexC_Dahua {
    name: string;
    type: Enum.ECameraType.dahua;
    config: IConfigDahuaCamera;
}

export interface IPcCameraIndexR {
    type?: Enum.ECameraType;
}

export interface IPcCameraIndexU_Dahua {
    objectId: string;
    type: Enum.ECameraType.dahua;
    config?: IConfigDahuaCamera;
}

export interface IPcCameraIndexD {
    objectId: string;
}

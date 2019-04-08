import { IConfigHanwha, IAction } from '../db/_index';
import * as Enum from '../../enums';

export interface IIndexC {
    cameraId: string;
}

export interface IIndexR {
    cameraId: string;
    name: string;
    mode: Enum.CameraMode;
    type: Enum.CameraType;
    config: IConfigHanwha;
    groups: string[];
    action: IAction;
}

export interface IDoCount {
    count: number;
}

export interface IAll {
    cameraId: string;
    name: string;
}

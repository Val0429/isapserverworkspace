import { IConfigHanwha, IAction } from '../db/_index';
import * as Enum from '../../enums';

export interface IIndexC {
    name: string;
    mode: Enum.CameraMode;
    type: Enum.CameraType;
    config: IConfigHanwha;
    groups: string[];
    action: IAction;
}

export interface IIndexU {
    cameraId: string;
    name?: string;
    mode?: Enum.CameraMode;
    type?: Enum.CameraType;
    config?: IConfigHanwha;
    groups?: string[];
    action?: IAction;
}

export interface IIndexD {
    cameraIds: string | string[];
}

export interface ICheck {
    type: Enum.CameraType;
    config: IConfigHanwha;
}

export interface IDoCount {
    cameraId: string;
}

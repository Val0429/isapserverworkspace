import { IConfigHanwha, IAction } from '../db/_index';
import * as Enum from '../../enums';

export interface IIndexC {
    cameraId: string;
}

export interface IIndexR {
    cameraId: string;
    name: string;
    mode: Enum.ECameraMode;
    type: Enum.ECameraType;
    config: IConfigHanwha;
}

export interface IDoCount {
    count: number;
}

export interface IAll {
    cameraId: string;
    name: string;
}

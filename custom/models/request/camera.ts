import { IConfigHanwha, IAction } from '../db/_index';
import * as Enum from '../../enums';

export interface IIndexC {
    name: string;
    mode: Enum.ECameraMode;
    type: Enum.ECameraType;
    config: IConfigHanwha;
}

export interface IIndexU {
    cameraId: string;
    name?: string;
    mode?: Enum.ECameraMode;
    type?: Enum.ECameraType;
    config?: IConfigHanwha;
}

export interface IIndexD {
    cameraIds: string | string[];
}

export interface ICheck {
    type: Enum.ECameraType;
    config: IConfigHanwha;
}

export interface IDoCount extends IConfigHanwha {}

import { Draw } from '../../helpers';
import * as Enum from '../../enums';
import { IConfigUniviewCamera } from '../db/_index';

export interface IIndexR {
    objectId: string;
}

export interface IIndexU {
    objectId: string;
    rois: Draw.ILocation[];
}

export interface ILocation {
    type?: 'all' | 'inMap' | 'outMap';
}

export interface IPcC {
    name: string;
    config: IConfigUniviewCamera;
}

export interface IPcU {
    objectId: string;
    name?: string;
    config?: IConfigUniviewCamera;
}

export interface IPcD {
    objectId: string;
}

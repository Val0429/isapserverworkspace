import { Draw } from '../../helpers';
import * as Enum from '../../enums';
import { IConfigEocorpexCamera } from '../db/_index';

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
    config: IConfigEocorpexCamera;
}

export interface IPcU {
    objectId: string;
    name?: string;
    config?: IConfigEocorpexCamera;
}

export interface IPcD {
    objectId: string;
}

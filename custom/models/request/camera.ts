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

export interface IAll {
    mode?: Enum.ECameraMode;
}

export interface ILocation {
    type?: 'all' | 'inMap' | 'outMap';
    mode?: Enum.ECameraMode;
}

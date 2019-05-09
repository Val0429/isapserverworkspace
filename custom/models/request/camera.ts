import { Draw } from '../../helpers';

export interface IIndexR {
    objectId: string;
}

export interface IIndexU {
    objectId: string;
    rois: Draw.ILocation[];
}

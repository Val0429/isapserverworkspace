import { ILocation } from '../base/_index';

/**
 * Building
 */
export interface IBuildingIndexR {
    objectId: string;
    name: string;
    location: ILocation.ICoordinate;
}

export interface IBuildingAll {
    objectId: string;
    name: string;
}

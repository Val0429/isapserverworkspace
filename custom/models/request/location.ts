import { ILocation } from '../base/_index';

/**
 * Building
 */
export interface IBuildingIndexC {
    name: string;
    location?: ILocation.ICoordinate;
}

export interface IBuildingIndexU {
    objectId: string;
    location?: ILocation.ICoordinate;
}

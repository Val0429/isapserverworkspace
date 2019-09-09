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

/**
 * Floor
 */
export interface IFloorsIndexC {
    buildingId: string;
    name: string;
    floor: number;
}

export interface IFloorsIndexR {
    buildingId?: string;
}

export interface IFloorsIndexU {
    objectId: string;
    buildingId?: string;
    floor?: number;
}

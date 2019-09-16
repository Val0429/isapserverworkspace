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
    name?: string;
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
    name?: string;
    buildingId?: string;
    floor?: number;
}

/**
 * Company
 */
export interface ICompaniesIndexC {
    floorIds: string[];
    name: string;
    contactPerson: string;
    contactNumber: string[];
    unitNumber: string;
}

export interface ICompaniesIndexR {
    floorId?: string;
}

export interface ICompaniesIndexU {
    objectId: string;
    floorIds?: string[];
    contactPerson?: string;
    contactNumber?: string[];
    unitNumber?: string;
}

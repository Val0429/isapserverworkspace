import { IObject } from './_index';
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

/**
 * Floor
 */
export interface IFloorsIndexR {
    objectId: string;
    building: IObject;
    name: string;
    floor: number;
}

export interface ICompaniesAll {
    objectId: string;
    name: string;
    building: IObject;
}

/**
 * Company
 */
export interface ICompaniesIndexR {
    objectId: string;
    floors: IObject[];
    name: string;
    contactPerson: string;
    contactNumber: string[];
    unitNumber: string;
}

export interface ICompaniesAll {
    objectId: string;
    name: string;
    floors: IObject[];
}

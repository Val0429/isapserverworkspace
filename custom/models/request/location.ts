import { ILocation } from '../base/_index';
import * as Enum from '../../enums';

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
    name?: string;
    floorIds?: string[];
    contactPerson?: string;
    contactNumber?: string[];
    unitNumber?: string;
}

/**
 * Endpoint
 */
export interface IEndpointFRS {
    model: Enum.EEndpoint.frs;
    clientId: string;
    sourceId: string;
}

export interface IEndpointHikVision {
    model: Enum.EEndpoint.hikvision;
    clientId: string;
}

/**
 * Door
 */

export interface IDoorIndexC_Base {
    name: string;
    floorId: string;
    endpoint: IEndpointFRS | IEndpointHikVision;
}

export interface IDoorIndexC_A extends IDoorIndexC_Base {
    companyId: string;
}

export interface IDoorIndexC_B extends IDoorIndexC_Base {
    range: Enum.EDoorRange;
}

export type IDoorIndexC = IDoorIndexC_A | IDoorIndexC_B;

export interface IDoorIndexR {
    floorId?: string;
    companyId?: string;
}

export interface IDoorIndexU_Base {
    objectId: string;
    name?: string;
    floorId?: string;
    endpoint?: IEndpointFRS | IEndpointHikVision;
}

export interface IDoorIndexU_A extends IDoorIndexU_Base {
    companyId: string;
}

export interface IDoorIndexU_B extends IDoorIndexU_Base {
    range: Enum.EDoorRange;
}

export type IDoorIndexU = IDoorIndexU_Base | IDoorIndexU_A | IDoorIndexU_B;

/**
 * Endpoint
 */
export interface IEndpointFRS {
    model: Enum.EEndpoint.frs;
    clientId: string;
    sourceId: string;
}

export interface IEndpointHikVision {
    model: Enum.EEndpoint.hikvision;
    clientId: string;
}

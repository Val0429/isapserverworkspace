import { IDayRange } from '../db/_index';

interface IGPS {
    longitude?: number;
    latitude?: number;
}

export interface IRegionIndexC extends IGPS {
    parentId?: string;
    type: string;
    name: string;
    customId?: string;
    address?: string;
    imageBase64: string;
}

export interface IRegionIndexR {
    parentId?: string;
}

export interface IRegionIndexU extends IGPS {
    objectId: string;
    type?: string;
    name?: string;
    customId?: string;
    address?: string;
    imageBase64?: string;
}

export interface ISiteIndexC extends IGPS {
    name: string;
    customId: string;
    managerId: string;
    address?: string;
    phone?: string;
    establishment?: Date;
    squareMeter?: number;
    staffNumber?: number;
    officeHours?: IDayRange[];
    imageBase64: string;
}

export interface ISiteIndexU extends IGPS {
    objectId: string;
    name?: string;
    managerId?: string;
    address?: string;
    phone?: string;
    establishment?: Date;
    squareMeter?: number;
    staffNumber?: number;
    officeHours?: IDayRange[];
    imageBase64?: string;
}

export interface ISiteAll {
    type: 'all' | 'binding' | 'unbinding';
    regionId?: string;
}

export interface ISiteBindingRegion {
    objectId: string;
    regionId: string;
}

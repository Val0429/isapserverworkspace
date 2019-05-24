import { IDayRange } from '../db/_index';
import * as Enum from '../../enums';

interface IGPS {
    longitude?: number;
    latitude?: number;
}

export interface IRegionIndexC extends IGPS {
    parentId?: string;
    name: string;
    level: number;
    imageBase64: string;
}

export interface IRegionIndexR {
    parentId?: string;
    level?: number;
}

export interface IRegionIndexU extends IGPS {
    objectId: string;
    name?: string;
    level?: number;
    imageBase64?: string;
}

import { IObject } from './_index';
import { IDayRange } from '../db/_index';

export interface IIndexR {
    objectId: string;
    name: string;
    dayRanges: IDayRange[];
    sites: IObject[];
}

export interface IAll {
    objectId: string;
    name: string;
}

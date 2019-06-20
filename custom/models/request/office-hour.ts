import { IDayRange } from '../db/_index';

export interface IIndexC {
    name: string;
    dayRanges: IDayRange[];
}

export interface IIndexU {
    objectId: string;
    dayRanges: IDayRange[];
}

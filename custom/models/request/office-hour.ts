import { IDay } from '../base/_index';

export interface IIndexC {
    name: string;
    dayRanges: IDay.IRange[];
}

export interface IIndexU {
    objectId: string;
    dayRanges: IDay.IRange[];
}

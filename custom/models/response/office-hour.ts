import { IObject } from './_index';
import { IDay } from '../base/_index';

export interface IIndexR {
    objectId: string;
    name: string;
    dayRanges: IDay.IRange[];
    sites: IObject[];
}

export interface IAll {
    objectId: string;
    name: string;
}

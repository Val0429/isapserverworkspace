import { IObject } from './_index';

export interface IIndexR {
    objectId: string;
    name: string;
    description: string;
    regions: IObject[];
    sites: IObject[];
}

export interface IAll {
    objectId: string;
    name: string;
}

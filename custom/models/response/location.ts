import { IDayRange } from '../db/_index';
import { IObject } from './_index';

interface IGPS {
    longitude: number;
    latitude: number;
}

export interface IRegionIndexR_Base extends IGPS {
    name: string;
    customId: string;
    address: string;
    tags: IObject[];
    imageSrc: string;
}

export interface IRegionIndexR extends IRegionIndexR_Base {
    objectId: string;
    parentId: string;
    type: string;
}

export interface ISiteIndexR_Base extends IGPS {
    name: string;
    customId: string;
    manager: IObject;
    address: string;
    phone: string;
    establishment: Date;
    squareMeter: number;
    staffNumber: number;
    officeHours: IDayRange[];
    tags: IObject[];
    imageSrc: string;
}

export interface ISiteIndexR extends ISiteIndexR_Base {
    objectId: string;
    region: IObject;
}

export interface ISiteAll {
    objectId: string;
    region: IObject;
    name: string;
}

export interface ITree {
    objectId: string;
    parentId: string;
    type: string;
    data: IRegionIndexR_Base | ISiteIndexR_Base;
    lft: number;
    rgt: number;
    childrens: ITree[];
}

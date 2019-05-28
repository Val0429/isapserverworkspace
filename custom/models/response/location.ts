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

export interface ITree {
    objectId: string;
    parentId: string;
    type: string;
    data?: IRegionIndexR_Base;
    lft: number;
    rgt: number;
    childrens: ITree[];
}

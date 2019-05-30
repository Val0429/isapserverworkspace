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
    imageSrc: string;
}

export interface IRegionIndexR extends IRegionIndexR_Base {
    objectId: string;
    parentId: string;
    type: string;
}

export interface IRegionAll {
    objectId: string;
    name: string;
}

export interface ISiteIndexR_Base extends IGPS {
    name: string;
    customId: string;
    address: string;
    imageSrc: string;
}

export interface ISiteIndexR extends ISiteIndexR_Base {
    objectId: string;
    region: IObject;
    manager: IObject;
    phone: string;
    establishment: Date;
    squareMeter: number;
    staffNumber: number;
    officeHour: IObject;
}

export interface ISiteAll {
    objectId: string;
    region: IObject;
    name: string;
}

export interface IAreaIndexR_Base {
    name: string;
    imageSrc: string;
    mapSrc: string;
}

export interface IAreaIndexR extends IAreaIndexR_Base {
    objectId: string;
    site: IObject;
}

export interface IAreaAll {
    objectId: string;
    site: IObject;
    name: string;
}

export interface ITreeRegion extends IRegionIndexR_Base {
    tags: IObject[];
}

export interface ITreeSite extends ISiteIndexR_Base {
    tags: IObject[];
}

export interface ITreeArea extends IAreaIndexR_Base {}

export interface ITree {
    objectId: string;
    parentId: string;
    type: string;
    data: ITreeRegion | ITreeSite | ITreeArea;
    lft: number;
    rgt: number;
    childrens: ITree[];
}

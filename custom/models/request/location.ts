export interface IRegionC {
    name: string;
    longitude?: number;
    latitude?: number;
    imageBase64: string;
    imageWidth: number;
    imageHeight: number;
}

export interface IRegionU {
    regionId: string;
    name?: string;
    longitude?: number;
    latitude?: number;
    imageBase64?: string;
    imageWidth?: number;
    imageHeight?: number;
}

export interface IRegionD {
    regionIds: string | string[];
}

export interface ISiteC {
    regionId: string;
    name: string;
    iconBase64: string;
    iconWidth: number;
    iconHeight: number;
    x: number;
    y: number;
}

export interface ISiteR {
    regionId?: string;
}

export interface ISiteU {
    siteId: string;
    name?: string;
    iconBase64?: string;
    iconWidth?: number;
    iconHeight?: number;
    x?: number;
    y?: number;
}

export interface ISiteD {
    siteIds: string | string[];
}

export interface IFloorC {
    siteId: string;
    name: string;
    floor: number;
    imageBase64: string;
    imageWidth: number;
    imageHeight: number;
}

export interface IFloorR {
    siteId?: string;
}

export interface IFloorU {
    floorId: string;
    name?: string;
    floor?: number;
    imageBase64?: string;
    imageWidth?: number;
    imageHeight?: number;
}

export interface IFloorD {
    floorIds: string | string[];
}

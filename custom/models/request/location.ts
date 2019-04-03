export interface IRegionIndexC {
    name: string;
    longitude?: number;
    latitude?: number;
    imageBase64: string;
    imageWidth: number;
    imageHeight: number;
}

export interface IRegionIndexU {
    regionId: string;
    name?: string;
    longitude?: number;
    latitude?: number;
    imageBase64?: string;
    imageWidth?: number;
    imageHeight?: number;
}

export interface IRegionIndexD {
    regionIds: string | string[];
}

export interface ISiteIndexC {
    regionId: string;
    name: string;
    iconBase64: string;
    iconWidth: number;
    iconHeight: number;
    x: number;
    y: number;
}

export interface ISiteIndexR {
    regionId?: string;
}

export interface ISiteIndexU {
    siteId: string;
    name?: string;
    iconBase64?: string;
    iconWidth?: number;
    iconHeight?: number;
    x?: number;
    y?: number;
}

export interface ISiteIndexD {
    siteIds: string | string[];
}

export interface IFloorIndexC {
    siteId: string;
    name: string;
    floor: number;
    imageBase64: string;
    imageWidth: number;
    imageHeight: number;
}

export interface IFloorIndexR {
    siteId?: string;
}

export interface IFloorIndexU {
    floorId: string;
    name?: string;
    floor?: number;
    imageBase64?: string;
    imageWidth?: number;
    imageHeight?: number;
}

export interface IFloorIndexD {
    floorIds: string | string[];
}

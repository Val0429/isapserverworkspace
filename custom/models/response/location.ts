export interface IRegionC {
    regionId: string;
}

export interface IRegionR {
    regionId: string;
    name: string;
    longitude: number;
    latitude: number;
    imageSrc: string;
    imageWidth: number;
    imageHeight: number;
}

export interface ISiteC {
    siteId: string;
}

export interface ISiteR {
    regionId: string;
    siteId: string;
    name: string;
    iconSrc: string;
    iconWidth: number;
    iconHeight: number;
    x: number;
    y: number;
}

export interface IFloorC {
    floorId: string;
}

export interface IFloorR {
    siteId: string;
    floorId: string;
    name: string;
    floor: number;
    imageSrc: string;
    imageWidth: number;
    imageHeight: number;
}

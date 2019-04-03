export interface IRegionIndexC {
    regionId: string;
}

export interface IRegionIndexR {
    regionId: string;
    name: string;
    longitude: number;
    latitude: number;
    imageSrc: string;
    imageWidth: number;
    imageHeight: number;
}

export interface ISiteIndexC {
    siteId: string;
}

export interface ISiteIndexR {
    regionId: string;
    siteId: string;
    name: string;
    iconSrc: string;
    iconWidth: number;
    iconHeight: number;
    x: number;
    y: number;
    imageSrc: string;
    imageWidth: number;
    imageHeight: number;
}

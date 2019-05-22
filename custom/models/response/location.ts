export interface IMapIndexR {
    objectId: string;
    parentId: string;
    name: string;
    level: string;
    imageSrc: string;
    imageWidth: number;
    imageHeight: number;
    longitude: number;
    latitude: number;
    x: number;
    y: number;
    dataWindowX: number;
    dataWindowY: number;
}

export interface IMapTree {
    objectId: string;
    level: string;
    name: string;
    lft: number;
    rgt: number;
    childrens: IMapTree[];
}

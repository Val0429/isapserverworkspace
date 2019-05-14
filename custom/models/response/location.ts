export interface IIndexC {
    objectId: string;
}

export interface IIndexR {
    objectId: string;
    parentId: string;
    name: string;
    level: string;
    no: number;
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

export interface ITree {
    objectId: string;
    level: string;
    name: string;
    lft: number;
    rgt: number;
    childrens: ITree[];
}

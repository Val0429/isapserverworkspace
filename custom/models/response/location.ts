export interface IRegionIndexR {
    objectId: string;
    parentId: string;
    name: string;
    level: number;
    imageSrc: string;
    longitude?: number;
    latitude?: number;
    lft: number;
    rgt: number;
}

export interface IRegionTree {
    objectId: string;
    level: number;
    name: string;
    lft: number;
    rgt: number;
    childrens: IRegionTree[];
}

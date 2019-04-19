export interface IFloorC {
    name: string;
    floorNo: number;
    imageBase64: string;
    imageWidth: number;
    imageHeight: number;
}

export interface IFloorU {
    objectId: string;
    name?: string;
    floorNo?: number;
    imageBase64?: string;
    imageWidth?: number;
    imageHeight?: number;
}

export interface IFloorD {
    objectId: string;
}

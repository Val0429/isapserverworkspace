export interface IFloorC {
    objectId: string;
}

export interface IFloorR {
    objectId: string;
    name: string;
    floorNo: number;
    imageSrc: string;
    imageWidth: number;
    imageHeight: number;
    dataWindowX: number;
    dataWindowY: number;
}

export interface IDeviceC {
    objectId: string;
}

export interface IDeviceR {
    objectId: string;
    floorId: string;
    type: string;
    cameraId: string;
    name: string;
    iconSrc: string;
    iconWidth: number;
    iconHeight: number;
    x: number;
    y: number;
    angle: number;
    visibleDistance: number;
    visibleAngle: number;
    dataWindowX: number;
    dataWindowY: number;
    action: any;
}

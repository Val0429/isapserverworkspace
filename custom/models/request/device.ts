import { Draw } from '../../helpers';
import * as Enum from '../../enums';
import { ICameraHanwha } from '../db/_index';

export interface IGroupIndexC {
    areaId: string;
    mode: Enum.EDeviceMode;
    name: string;
}

export interface IGroupIndexU {
    objectId: string;
}

export interface IGroupAll {
    siteId?: string;
    areaId?: string;
    mode?: Enum.EDeviceMode;
}

export interface IC_Base {
    customId: string;
    areaId: string;
    groupIds: string[];
    name: string;
}

export interface ICameraFRS {
    serverId: string;
    sourceid: string;
}

export interface ICameraCMS {
    serverId: string;
    nvrId: number;
    channelId: number;
}

export interface IDemographicC extends IC_Base {
    config: ICameraFRS;
    demoServerId: string;
}

export interface IDwellTimeC extends IC_Base {
    config: ICameraFRS;
    direction: Enum.EDeviceDirection;
}

export interface IHeatmapC extends IC_Base {
    config: ICameraCMS;
    rois: Draw.ILocation[];
}

export interface IHumanDetectionC extends IC_Base {
    config: ICameraCMS;
    hdServerId: string;
    rois: Draw.ILocation[];
}

export interface IPeopleCountingC_Hanwha extends IC_Base {
    brand: Enum.EDeviceBrand.hanwha;
    model: Enum.EDeviceModelHanwha;
    config: ICameraHanwha;
}

export interface IPeopleCountingC_FRS extends IC_Base {
    brand: Enum.EDeviceBrand.isap;
    config: ICameraFRS;
    direction: Enum.EDeviceDirection;
}

export interface IVisitorC extends IC_Base {
    config: ICameraFRS;
}

export interface IIndexR {
    mode?: Enum.EDeviceMode;
}

export interface IU_Base {
    objectId: string;
    areaId?: string;
    groupIds?: string[];
    name?: string;
    x?: number;
    y?: number;
    angle?: number;
    visibleDistance?: number;
    visibleAngle?: number;
    dataWindowX?: number;
    dataWindowY?: number;
}

export interface IDemographicU extends IU_Base {
    config?: ICameraFRS;
    demoServerId?: string;
}

export interface IDwellTimeU extends IU_Base {
    config?: ICameraFRS;
    direction?: Enum.EDeviceDirection;
}

export interface IHeatmapU extends IU_Base {
    config?: ICameraCMS;
    rois?: Draw.ILocation[];
}

export interface IHumanDetectionU extends IU_Base {
    config?: ICameraCMS;
    hdServerId?: string;
    rois?: Draw.ILocation[];
}

export interface IPeopleCountingU_Hanwha extends IU_Base {
    brand?: Enum.EDeviceBrand.hanwha;
    model: Enum.EDeviceModelHanwha;
    config: ICameraHanwha;
}

export interface IPeopleCountingU_FRS extends IU_Base {
    brand?: Enum.EDeviceBrand.isap;
    config: ICameraFRS;
    direction: Enum.EDeviceDirection;
}

export interface IVisitorU extends IU_Base {
    config?: ICameraFRS;
}

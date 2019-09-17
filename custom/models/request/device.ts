import { Draw } from '../../helpers';
import * as Enum from '../../enums';
import { ICameraHanwha, IThreshold } from '../db/_index';

export interface IGroupIndexC {
    areaId: string;
    mode: Enum.EDeviceMode;
    name: string;
    threshold: IThreshold;
}

export interface IGroupIndexU {
    objectId: string;
    threshold?: IThreshold;
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

export interface ICameraFRSManager {
    serverId: string;
    frsId: string;
    frsIp: string;
    sourceId: string;
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

export interface IDemographicC_FRS extends IC_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.frs;
    config: ICameraFRS;
    demoServerId: string;
}

export interface IDemographicC_FRSManager extends IC_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.frsManager;
    config: ICameraFRSManager;
    demoServerId: string;
}

export interface IDwellTimeC_FRSManager extends IC_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.frsManager;
    config: ICameraFRSManager;
    demoServerId: string;
    direction: Enum.EDeviceDirection;
}

export interface IPeopleCountingC_Hanwha extends IC_Base {
    brand: Enum.EDeviceBrand.hanwha;
    model: Enum.EDeviceModelHanwha;
    config: ICameraHanwha;
}

export interface IPeopleCountingC_FRS extends IC_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.frs;
    config: ICameraFRS;
    direction: Enum.EDeviceDirection;
}

export interface IPeopleCountingC_FRSManager extends IC_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.frsManager;
    config: ICameraFRSManager;
    direction: Enum.EDeviceDirection;
}

export interface IVisitorC_FRSManager extends IC_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.frsManager;
    config: ICameraFRSManager;
}

export interface IHeatmapC_CMS extends IC_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.cms;
    config: ICameraCMS;
    hdServerId: string;
    rois: Draw.ILocation[];
}

export interface IHumanDetectionC_CMS extends IC_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.cms;
    config: ICameraCMS;
    hdServerId: string;
    rois: Draw.ILocation[];
}

export interface IIndexR {
    siteId?: string;
    areaId?: string;
    groupId?: string;
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

export interface IDemographicU_FRS extends IU_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.frs;
    config?: ICameraFRS;
    demoServerId?: string;
}

export interface IDemographicU_FRSManager extends IU_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.frsManager;
    config?: ICameraFRSManager;
    demoServerId?: string;
}

export interface IDwellTimeU_FRSManager extends IU_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.frsManager;
    config?: ICameraFRSManager;
    demoServerId?: string;
    direction?: Enum.EDeviceDirection;
}

export interface IPeopleCountingU_Hanwha extends IU_Base {
    brand: Enum.EDeviceBrand.hanwha;
    model: Enum.EDeviceModelHanwha;
    config?: ICameraHanwha;
}

export interface IPeopleCountingU_FRS extends IU_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.frs;
    config?: ICameraFRS;
    direction?: Enum.EDeviceDirection;
}

export interface IPeopleCountingU_FRSManager extends IU_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.frsManager;
    config?: ICameraFRSManager;
    direction?: Enum.EDeviceDirection;
}

export interface IVisitorU_FRSManager extends IU_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.frsManager;
    config?: ICameraFRSManager;
}

export interface IHeatmapU_CMS extends IU_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.cms;
    config?: ICameraCMS;
    hdServerId?: string;
    rois?: Draw.ILocation[];
}

export interface IHumanDetectionU_CMS extends IU_Base {
    brand: Enum.EDeviceBrand.isap;
    model: Enum.EDeviceModelIsap.cms;
    config?: ICameraCMS;
    hdServerId?: string;
    rois?: Draw.ILocation[];
}

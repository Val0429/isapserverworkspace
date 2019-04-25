import * as Enum from '../../enums';

export interface IHumanDetection {
    objectId: string;
    deviceId: string;
    date: Date;
    imageSrc: string;
    value: number;
}

export interface IHumanDetectionSummary {
    objectId: string;
    floorId: string;
    floorName: string;
    areaId: string;
    areaName: string;
    type: string;
    date: Date;
    total: number;
    count: number;
    average: number;
    maxId: string;
    maxValue: number;
    mediumThresholds: IHumanDetection[];
    highThresholds: IHumanDetection[];
}

export interface IHumanDetectionSummaryR {
    summarys: IHumanDetectionSummary[];
}

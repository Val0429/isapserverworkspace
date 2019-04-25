import * as Enum from '../../enums';

export interface IHumanDetection {
    date: Date;
    imageSrcs: string[];
    total: number;
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

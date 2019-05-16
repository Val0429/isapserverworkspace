import * as Enum from '../../enums';

export interface IHumanDetectionSummaryBase {
    dataRangeType: Enum.ESummaryType;
    startDate: Date;
    endDate: Date;
}

export interface IHumanDetectionFloorSummary extends IHumanDetectionSummaryBase {
    floorIds: string | string[];
}

export interface IHumanDetectionAreaSummary extends IHumanDetectionSummaryBase {
    areaIds: string | string[];
}

export interface IPeopleCountingFloorSummary extends IHumanDetectionFloorSummary {}

export interface IPeopleCountingAreaSummary extends IHumanDetectionAreaSummary {}

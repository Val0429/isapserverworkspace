import * as Enum from '../../enums';

export interface IHumanDetectionSummaryR {
    floorIds: string | string[];
    dataRangeType: Enum.ESummaryType;
    startDate: Date;
    endDate: Date;
}

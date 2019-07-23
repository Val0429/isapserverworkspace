import { IDateRange, IDaySingle } from '../db/_index';
import * as Enum from '../../enums';

export interface ISalesRecordC {
    customId: string;
    date: Date;
    revenue: number;
    transaction: number;
}

export interface ISalesRecordR {
    siteId?: string;
    date?: Date;
}

export interface ISalesRecordU {
    objectId: string;
    revenue?: number;
    transaction?: number;
}

export interface ISummaryBase extends IDateRange {
    type: Enum.ESummaryType;
    siteIds: string[];
    tagIds: string[];
}

export interface IComplex extends ISummaryBase {}

export interface IPeopleCountingSummary extends ISummaryBase {}

export interface IDemographicSummary extends ISummaryBase {}

export interface IHumanDetectionSummary extends ISummaryBase {}

export interface IHumanDetectionThreshold extends IDateRange {
    areaId: string;
    type: 'medium' | 'high';
}

export interface IRepeatVisitorSummary extends ISummaryBase {}

export interface ICampaignMultiCampaignSummary {
    campaignIds: string[];
}

export interface ICampaignSingleCampaignSummary {
    campaignId: string;
    siteIds: string[];
}

export interface ITemplateC_Base {
    name: string;
    mode: Enum.EDeviceMode;
    siteIds: string[];
    tagIds: string[];
    sendDates: IDaySingle[];
    sendUserIds: string[];
}

export interface ITemplateC_Type extends ITemplateC_Base {
    type: Enum.EDatePeriodType;
}

export interface ITemplateC_Date extends ITemplateC_Base, IDateRange {}

export interface ITemplateU {
    objectId: string;
    name?: string;
    mode?: Enum.EDeviceMode;
    type?: Enum.EDatePeriodType;
    siteIds?: string[];
    tagIds?: string[];
    startDate?: Date;
    endDate?: Date;
    sendDates?: IDaySingle[];
    sendUserIds?: string[];
}

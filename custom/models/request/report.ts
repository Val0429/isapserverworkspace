import { IDate, IDay } from '../base/_index';
import * as Enum from '../../enums';

/**
 * Sales Record
 */
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

/**
 * Summary Common
 */
export interface ISummaryBase extends IDate.IRange {
    type: Enum.ESummaryType;
    siteIds: string[];
    tagIds: string[];
}

/**
 * Index Common
 */
export interface IIndexBase extends IDate.IRange {
    siteId: string;
    areaId?: string;
    deviceGroupId?: string;
    deviceId?: string;
}

/**
 * Complex
 */
export interface IComplex extends ISummaryBase {}

/**
 * People Counting
 */
export interface IPeopleCountingSummary extends ISummaryBase {}

export interface IPeopleCountingIndex extends IIndexBase {
    isIn?: boolean;
    isEmployee?: boolean;
}

/**
 * Demographic
 */
export interface IDemographicSummary extends ISummaryBase {}

export interface IDemographicIndex extends IIndexBase {
    isEmployee?: boolean;
}

/**
 * Human Detection
 */
export interface IHumanDetectionSummary extends ISummaryBase {}

export interface IHumanDetectionThreshold extends IDate.IRange {
    areaId: string;
    type: 'medium' | 'high';
}

/**
 * Repeat Visitor
 */
export interface IRepeatVisitorSummary extends ISummaryBase {}

export interface IRepeatVisitorIndex extends IDate.IRange {
    siteIds: string | string[];
    count?: number;
}

/**
 * Campaign
 */
export interface ICampaignMultiCampaignSummary {
    campaignIds: string[];
}

export interface ICampaignSingleCampaignSummary {
    campaignId: string;
    siteIds: string[];
}

/**
 * Heatmap
 */
export interface IHeatmapSummary extends IDate.IRange {
    type: Enum.ESummaryType;
    siteId: string;
}

/**
 * Dwell Time
 */
export interface IDwellTimeSummary extends ISummaryBase {}

export interface IDwellTimeIndex extends IIndexBase {
    isEmployee?: boolean;
}

/**
 * Identity Person
 */
export interface IIdentityPerson extends IDate.IRange {
    type: Enum.ESummaryType;
    tagIds: string[];
}

/**
 * Template
 */
export interface ITemplateC_Base {
    name: string;
    mode: Enum.EDeviceMode;
    siteIds: string[];
    tagIds: string[];
    sendDates: IDay.ISingle[];
    sendUserIds: string[];
}

export interface ITemplateC_Type extends ITemplateC_Base {
    type: Enum.EDatePeriodType;
}

export interface ITemplateC_Date extends ITemplateC_Base, IDate.IRange {}

export interface ITemplateU {
    objectId: string;
    name?: string;
    mode?: Enum.EDeviceMode;
    type?: Enum.EDatePeriodType;
    siteIds?: string[];
    tagIds?: string[];
    startDate?: Date;
    endDate?: Date;
    sendDates?: IDay.ISingle[];
    sendUserIds?: string[];
}

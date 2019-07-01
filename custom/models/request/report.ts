import { IDateRange } from '../db/_index';
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

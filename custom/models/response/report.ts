import { IDate, IDay } from '../base/_index';
import { IReportDwellTimeRange } from '../db/_index';
import { IObject } from './_index';

/**
 * Sales Record
 */
export interface ISalesRecordR {
    objectId: string;
    site: IObject;
    date: Date;
    revenue: number;
    transaction: number;
}

/**
 * Summary Common
 */
export interface ISummaryWeather {
    site: IObject;
    date: Date;
    icon: string;
    temperatureMin: number;
    temperatureMax: number;
}

export interface ISummaryOfficeHour {
    objectId: string;
    name: string;
    dayRanges: IDay.IRange[];
    sites: IObject[];
}

export interface ISalesRecordSummaryData {
    site: IObject;
    date: Date;
    revenue: number;
    transaction: number;
    traffic: number;
}

export interface ISummaryDataBase {
    site: IObject;
    area: IObject;
    deviceGroups: IObject[];
    device: IObject;
    date: Date;
    type: string;
}

/**
 * Index Common
 */
export interface IIndexBase {
    site: IObject;
    area: IObject;
    deviceGroups: IObject[];
    device: IObject;
    date: Date;
    imageSrc: string;
}

/**
 * Complex
 */
export interface IComplex_Data {
    value: number;
    variety: number;
}

export interface IComplex_Data_Demographic extends IComplex_Gender {
    maleVariety: number;
    femaleVariety: number;
}

export interface IComplex_Gender {
    malePercent: number;
    femalePercent: number;
}

export interface IComplex_SalesRecord {
    revenue: number;
    transaction: number;
}

export interface IComplex_Count {
    in: number;
    out: number;
}

export interface IComplex_Average {
    total: number;
    count: number;
}

export interface IComplex {
    peopleCounting: IComplex_Data;
    humanDetection: IComplex_Data;
    dwellTime: IComplex_Data;
    demographic: IComplex_Data_Demographic;
    visitor: IComplex_Data;
    repeatVisitor: IComplex_Data;
    revenue: IComplex_Data;
    transaction: IComplex_Data;
    conversion: IComplex_Data;
    asp: IComplex_Data;
    weather?: ISummaryWeather;
}

/**
 * People Counting
 */
export interface IPeakHourData {
    date: Date;
    level: number;
}

export interface IPeakHour {
    site: IObject;
    date: Date;
    peakHourDatas: IPeakHourData[];
}

export interface IPeopleCountingSummaryData extends ISummaryDataBase {
    in: number;
    prevIn?: number;
    out: number;
    prevOut?: number;
    inEmployee: number;
    prevInEmployee?: number;
    outEmployee: number;
    prevOutEmployee?: number;
}

export interface IPeopleCountingSummary {
    weathers: ISummaryWeather[];
    officeHours: ISummaryOfficeHour[];
    peakHours: IPeakHour[];
    salesRecords: ISalesRecordSummaryData[];
    summaryDatas: IPeopleCountingSummaryData[];
}

export interface IPeopleCountingIndex extends IIndexBase {
    isIn: boolean;
    isEmployee: boolean;
}

/**
 * Demographic
 */
export interface IDemographicSummaryData extends ISummaryDataBase {
    maleTotal: number;
    maleRanges: number[];
    prevMaleTotal?: number;
    prevMaleRanges?: number[];
    femaleTotal: number;
    femaleRanges: number[];
    prevFemaleTotal?: number;
    prevFemaleRanges?: number[];
    maleEmployeeTotal: number;
    maleEmployeeRanges: number[];
    prevMaleEmployeeTotal?: number;
    prevMaleEmployeeRanges?: number[];
    femaleEmployeeTotal: number;
    femaleEmployeeRanges: number[];
    prevFemaleEmployeeTotal?: number;
    prevFemaleEmployeeRanges?: number[];
}

export interface IDemographicSummary {
    weathers: ISummaryWeather[];
    officeHours: ISummaryOfficeHour[];
    summaryDatas: IDemographicSummaryData[];
}

export interface IDemographicIndex extends IIndexBase {
    isEmployee: boolean;
    age: number;
    gender: string;
}

/**
 * Human Detection
 */
export interface IHumanDetectionSummaryTableData {
    site: IObject;
    area: IObject;
    date: Date;
    type: string;
    total: number;
    prevTotal?: number;
    count: number;
    prevCount?: number;
    maxValue: number;
    mediumThreshold?: number;
    mediumThresholdCount?: number;
    highThreshold?: number;
    highThresholdCount?: number;
}

export interface IHumanDetectionSummaryChartData extends ISummaryDataBase {
    total: number;
    count: number;
}

export interface IHumanDetectionSummary {
    weathers: ISummaryWeather[];
    officeHours: ISummaryOfficeHour[];
    summaryTableDatas: IHumanDetectionSummaryTableData[];
    summaryChartDatas: IHumanDetectionSummaryChartData[];
}

export interface IHumanDetectionThreshold {
    site: IObject;
    area: IObject;
    date: Date;
    total: number;
    imageSrcs: string[];
}

/**
 * Repeat Visitor
 */
export interface IRepeatVisitorSummaryChartData {
    total: number;
    totalRanges: number[];
    maleRanges: number[];
    femaleRanges: number[];
}

export interface IRepeatVisitorSummaryTableData {
    site: IObject;
    date: Date;
    frequencyRanges: number[];
}

export interface IRepeatVisitorSummary {
    summaryChartDatas: IRepeatVisitorSummaryChartData[];
    summaryTableDatas: IRepeatVisitorSummaryTableData[];
}

export interface IRepeatVisitorIndex {
    faceId: string;
    count: string;
    datas: IIndexBase[];
}

/**
 * Campaign
 */
export interface ICampaignMultiCampaignSummaryData extends IDate.IRange {
    campaign: IObject;
    traffic: number;
    budget: number;
    budgetPercent: number;
    trafficGainPer: number;
}

export interface ICampaignMultiCampaignSummary {
    budgetTotal: number;
    summaryDatas: ICampaignMultiCampaignSummaryData[];
}

export interface ICampaignSingleCampaignSummaryData {
    type: number;
    date: Date;
    traffic: number;
}

export interface ICampaignSingleCampaignSummary {
    budget: number;
    trafficGainPer: number;
    traffic: number;
    beforeTraffic: number;
    afterTraffic: number;
    changeTrafficCampaign: number;
    changeAfterTrafficCampaign: number;
    summaryDatas: ICampaignSingleCampaignSummaryData[];
}

export interface ICampaignConditionObject extends IObject {
    sites: IObject[];
}

export interface ICampaignCondition {
    [key: string]: ICampaignConditionObject[];
}

/**
 * Heatmap
 */
export interface IHeatmapSummaryData extends ISummaryDataBase {
    imageSrc: string;
    gridUnit: number;
    width: number;
    height: number;
    scores: number[][];
}

export interface IHeatmapSummary {
    officeHours: ISummaryOfficeHour[];
    summaryDatas: IHeatmapSummaryData[];
}

/**
 * Dwell Time
 */
export interface IDwellTimeSummaryData extends ISummaryDataBase {
    total: number;
    prevTotal?: number;
    count: number;
    prevCount?: number;
    maleTotal: number;
    maleEmployeeTotal: number;
    femaleTotal: number;
    femaleEmployeeTotal: number;
    dwellTimeRanges: IReportDwellTimeRange[];
}

export interface IDwellTimeSummary {
    weathers: ISummaryWeather[];
    officeHours: ISummaryOfficeHour[];
    salesRecords: ISalesRecordSummaryData[];
    summaryDatas: IDwellTimeSummaryData[];
}

export interface IDwellTimeIndex extends IIndexBase {
    isEmployee: boolean;
    inDate: Date;
    outDate: Date;
    dwellTimeSecond: number;
    dwellTimeLevel: number;
}

/**
 * Identity Person
 */
export interface IIdentityPerson {}

/**
 * Template
 */
export interface ISendUser extends IObject {
    email: string;
}

export interface ITemplateR {
    objectId: string;
    name: string;
    mode: string;
    type: string;
    sites: IObject[];
    tags: IObject[];
    startDate: Date;
    endDate: Date;
    sendDates: IDay.ISingle[];
    sendUsers: IObject[];
}

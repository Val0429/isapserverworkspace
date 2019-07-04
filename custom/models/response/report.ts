import { IDayRange, IDaySingle } from '../db/_index';
import { IObject } from './_index';

export interface ISalesRecordR {
    objectId: string;
    site: IObject;
    date: Date;
    revenue: number;
    transaction: number;
}

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

export interface IComplex {
    peopleCounting: IComplex_Data;
    humanDetection: IComplex_Data;
    dwellTime: IComplex_Data;
    demographic: IComplex_Data_Demographic;
    visitor: IComplex_Data;
    repeatCustomer: IComplex_Data;
    revenue: IComplex_Data;
    transaction: IComplex_Data;
    conversion: IComplex_Data;
    asp: IComplex_Data;
    weather?: ISummaryWeather;
}

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
    dayRanges: IDayRange[];
    sites: IObject[];
}

export interface ISalesRecordSummaryData {
    site: IObject;
    date: Date;
    revenue: number;
    transaction: number;
    traffic: number;
}

export interface IPeakHourData {
    date: Date;
    level: number;
}

export interface IPeakHour {
    site: IObject;
    date: Date;
    peakHourDatas: IPeakHourData[];
}

export interface ISummaryDataBase {
    site: IObject;
    area: IObject;
    deviceGroups: IObject[];
    device: IObject;
    date: Date;
    type: string;
}

export interface IPeopleCountingSummaryData extends ISummaryDataBase {
    in: number;
    prevIn?: number;
    out: number;
    prevOut?: number;
}

export interface IPeopleCountingSummary {
    weathers: ISummaryWeather[];
    officeHours: ISummaryOfficeHour[];
    peakHours: IPeakHour[];
    salesRecords: ISalesRecordSummaryData[];
    summaryDatas: IPeopleCountingSummaryData[];
}

export interface IGenderRange {
    totalRanges: number[];
    maleRanges: number[];
    femaleRanges: number[];
}

export interface IDemographicSummaryData extends ISummaryDataBase {
    maleTotal: number;
    maleRanges: number[];
    prevMaleTotal?: number;
    prevMaleRanges?: number[];
    femaleTotal: number;
    femaleRanges: number[];
    prevFemaleTotal?: number;
    prevFemaleRanges?: number[];
}

export interface IDemographicSummary {
    weathers: ISummaryWeather[];
    officeHours: ISummaryOfficeHour[];
    genderRange: IGenderRange;
    summaryDatas: IDemographicSummaryData[];
}

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
    sendDates: IDaySingle[];
    sendUsers: IObject[];
}

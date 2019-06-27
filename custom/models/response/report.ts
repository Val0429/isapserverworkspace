import { IObject } from './_index';

export interface ISalesRecordR {
    objectId: string;
    site: IObject;
    date: Date;
    revenue: number;
    transaction: number;
}

export interface ISummaryWeather {
    icon: string;
    temperatureMin: number;
    temperatureMax: number;
}

export interface ISalesRecordSummaryData {
    site: IObject;
    date: Date;
    revenue: number;
    transaction: number;
    conversion: number;
    asp: number;
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
    weather?: ISummaryWeather;
}

export interface IPeopleCountingSummaryData extends ISummaryDataBase {
    in: number;
    prevIn?: number;
    out: number;
    prevOut?: number;
}

export interface IPeopleCountingSummary {
    peakHours: IPeakHour[];
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
    genderRange: IGenderRange;
    summaryDatas: IDemographicSummaryData[];
}

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
    inVariety?: number;
    out: number;
    outVariety?: number;
}

export interface IPeopleCountingSummary {
    peakHours: IPeakHour[];
    summaryDatas: IPeopleCountingSummaryData[];
}

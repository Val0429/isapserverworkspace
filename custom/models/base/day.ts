import { IDate } from './_index';

export interface IRange extends IDate.IRange {
    startDay: string;
    endDay: string;
}

export interface ISingle {
    day: string;
    date: Date;
}

import { IDateRange } from '../';

export interface IIndexBase {
    date: IDateRange;
    title: string;
    content: string;
}

export interface IIndexC extends IIndexBase {}

export interface IIndexR {
    start?: Date;
    end?: Date;
    count?: number;
}

export interface IIndexU extends IIndexBase {
    publicCalendarId: string;
}

export interface IIndexD {
    publicCalendarIds: string | string[];
}

import { IDateRange } from '../';

export interface IIndexC {
    publicCalendarId: string;
}

export interface IIndexR {
    publicCalendarId: string;
    date: IDateRange;
    title: string;
    content: string;
}

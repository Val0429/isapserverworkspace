import { IDateRange } from '../';
import * as Enum from '../../enums';

export interface IIndexBase {
    date: IDateRange;
    title: string;
    content: string;
}

export interface IIndexC extends IIndexBase {
    aims: Enum.ResidentCharacter[];
}

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

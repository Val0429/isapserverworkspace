import { IDateRange } from '../';
import * as Enum from '../../enums';

export interface IIndexC {
    publicCalendarId: string;
}

export interface IIndexR {
    publicCalendarId: string;
    date: IDateRange;
    title: string;
    content: string;
    aims: Enum.ResidentCharacter[];
}

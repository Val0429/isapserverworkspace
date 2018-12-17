import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';
import { RepeatType } from '../enums';
import { ITimeRange } from './';

export interface ISchedule {
    name: string;
    type: RepeatType;
    timeRange: ITimeRange;
    endDate?: Date;
    descript: string;
}

@registerSubclass()
export class Schedule extends ParseObject<ISchedule> {}

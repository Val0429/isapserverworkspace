import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';
import { ISchedule } from './';

export interface IEventSchedule {
    schedule: ISchedule;
    level: number;
}

@registerSubclass()
export class EventSchedule extends ParseObject<IEventSchedule> {}

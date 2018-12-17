import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';
import { IEventSchedule } from './';

export interface IEventFilter {
    schedules?: IEventSchedule[];
    exceptions?: IEventSchedule[];
    defaultLevel: number;
}

@registerSubclass()
export class EventFilter extends ParseObject<IEventFilter> {}

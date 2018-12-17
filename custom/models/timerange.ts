import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

export interface ITimeRange {
    start: Date;
    end: Date;
}

@registerSubclass()
export class TimeRange extends ParseObject<ITimeRange> {}

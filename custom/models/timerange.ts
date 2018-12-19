import { registerSubclass, ParseObject } from '../../../helpers/parse-server/parse-helper';

export interface ITimeRange {
    name: string;
    start: Date;
    end: Date;
    descript?: string;
}

@registerSubclass()
export class TimeRange extends ParseObject<ITimeRange> {}

import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';
import { IEventFilter, IUserFilter } from './';

export interface IRegion {
    name: string;
    lft: number;
    rgt: number;
    events?: IEventFilter[];
    investigators?: IUserFilter;
    guards: IUserFilter[];
}

@registerSubclass()
export class Region extends ParseObject<IRegion> {}

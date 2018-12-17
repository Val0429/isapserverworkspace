import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

export interface IEventList {
    name: string;
}

@registerSubclass()
export class EventList extends ParseObject<IEventList> {}

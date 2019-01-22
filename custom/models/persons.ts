import { registerSubclass, ParseObject } from '../../../helpers/parse-server/parse-helper';
import { HumanDetection } from '../helpers';

export interface IPersons {
    source: string;
    nvr: number;
    channel: number;
    score: number;
    src: string;
    locations: HumanDetection.ILocation[];
    date: Date;
}

@registerSubclass()
export class Persons extends ParseObject<IPersons> {}

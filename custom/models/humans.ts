import { registerSubclass, ParseObject } from '../../../helpers/parse-server/parse-helper';
import { HumanDetection } from '../helpers';

export interface IHumans {
    analyst: string;
    source: string;
    camera: string;
    score: number;
    src: string;
    locations: HumanDetection.ILocation[];
    date: Date;
}

@registerSubclass()
export class Humans extends ParseObject<IHumans> {}

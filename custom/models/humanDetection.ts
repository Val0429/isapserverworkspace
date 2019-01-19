import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';
import { HumanDetect } from '../helpers';

export interface IHumanDetection {
    source: string;
    nvr: number;
    channel: number;
    score: number;
    src: string;
    locations: HumanDetect.ILocation[];
    date: Date;
}

@registerSubclass()
export class HumanDetection extends ParseObject<IHumanDetection> {}

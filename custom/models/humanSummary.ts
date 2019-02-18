import { registerSubclass, ParseObject } from '../../../helpers/parse-server/parse-helper';
import { Human } from './human';

export interface IHumanSummary {
    analyst: string;
    source: string;
    camera: string;
    type: string;
    date: Date;
    total: number;
    male: number;
    humans: Human[];
}

@registerSubclass()
export class HumanSummary extends ParseObject<IHumanSummary> {}

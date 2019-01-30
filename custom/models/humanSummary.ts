import { registerSubclass, ParseObject } from '../../../helpers/parse-server/parse-helper';

export interface IHumanSummary {
    analyst: string;
    source: string;
    camera: string;
    type: string;
    date: Date;
    total: number;
    male: number;
    ages: number[];
}

@registerSubclass()
export class HumanSummary extends ParseObject<IHumanSummary> {}

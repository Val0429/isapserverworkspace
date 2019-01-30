import { registerSubclass, ParseObject } from '../../../helpers/parse-server/parse-helper';

export interface IHumansSummary {
    analyst: string;
    source: string;
    camera: string;
    type: string;
    date: Date;
    total: number;
}

@registerSubclass()
export class HumansSummary extends ParseObject<IHumansSummary> {}

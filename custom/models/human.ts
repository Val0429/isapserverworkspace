import { registerSubclass, ParseObject } from '../../../helpers/parse-server/parse-helper';

export interface IHuman {
    analyst: string;
    source: string;
    camera: string;
    faceId: string;
    name: string;
    src: string;
    date: Date;
    age: number;
    gender: string;
}

@registerSubclass()
export class Human extends ParseObject<IHuman> {}

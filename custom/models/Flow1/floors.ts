import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/// Floors /////////////////////////////////////////
export interface IFlow1Floors {
    floor: number;
    name: string;
}
@registerSubclass() export class Flow1Floors extends ParseObject<IFlow1Floors> {}
////////////////////////////////////////////////////

import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Flow2Buildings } from './buildings';

/// Floors /////////////////////////////////////////
export interface IFlow2Floors {
    building: Flow2Buildings;
    floor: number;
    name: string;
}
@registerSubclass() export class Flow2Floors extends ParseObject<IFlow2Floors> {}
////////////////////////////////////////////////////

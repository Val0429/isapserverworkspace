import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

/// Floors /////////////////////////////////////////
export interface IFloors {
    floor: number;
    name: string;
}
@registerSubclass() export class Floors extends ParseObject<IFloors> {}
////////////////////////////////////////////////////

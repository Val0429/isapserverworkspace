import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

/// Floors /////////////////////////////////////////
export interface IPurposes {
    name: string;
}
@registerSubclass() export class Purposes extends ParseObject<IPurposes> {}
////////////////////////////////////////////////////

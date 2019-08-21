import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/// Floors /////////////////////////////////////////
export interface IFlow2Purposes {
    name: string;
}
@registerSubclass() export class Flow2Purposes extends ParseObject<IFlow2Purposes> {}
////////////////////////////////////////////////////

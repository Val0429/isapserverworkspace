import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/// Floors /////////////////////////////////////////
export interface IFlow1Purposes {
    name: string;
}
@registerSubclass() export class Flow1Purposes extends ParseObject<IFlow1Purposes> {}
////////////////////////////////////////////////////

import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

/// Floors /////////////////////////////////////////
export interface IVisitors {
    name: string;
    phone: string;
    email: string;
}
@registerSubclass() export class Visitors extends ParseObject<IVisitors> {}
////////////////////////////////////////////////////

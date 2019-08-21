import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/// Blacklists //////////////////////////////////////
export interface IFlow2Blacklists {
    faces: Parse.File[];
    faceFeatures?: Buffer[];
    /// 4 digits id
    idnumber: string;
    /// reference
    hash: string;
}
@registerSubclass() export class Flow2Blacklists extends ParseObject<IFlow2Blacklists> {}
////////////////////////////////////////////////////

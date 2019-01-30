import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/// 郵件 ////////////////////////////////////////////
export interface IPackages {
    address: string;
    sender: string;
    receiver: string;
    memo: string;
}
@registerSubclass() export class Packages extends ParseObject<IPackages> {}
////////////////////////////////////////////////////

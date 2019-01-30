import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/// 寄放物品 ////////////////////////////////////////
export interface IPlacedItems {
    owner: Parse.User;
    receiver: Parse.User;
    image: Parse.File;
    memo: string;
}
@registerSubclass() export class PlacedItems extends ParseObject<IPlacedItems> {}
////////////////////////////////////////////////////

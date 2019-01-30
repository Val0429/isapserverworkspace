import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Items } from './items';

/// 社區物品借用 ////////////////////////////////////
export interface IBorrowItems {
    item: Items;

    who: Parse.User;

    startDate: Date;
    endDate: Date;
}
@registerSubclass() export class BorrowItems extends ParseObject<IBorrowItems> {}
////////////////////////////////////////////////////

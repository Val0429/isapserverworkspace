import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

enum EItemType {
    Tool
}

/// 社區物品 ////////////////////////////////////////
export interface IItems {
    id: string;

    name: string;
    itemType: EItemType;
    totalCount: number;
}
@registerSubclass() export class Items extends ParseObject<IItems> {}
////////////////////////////////////////////////////

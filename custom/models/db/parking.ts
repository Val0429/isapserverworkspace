import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Community, CharacterResident } from './_index';

/**
 * 車位
 */
export interface IParking {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 社區
     */
    community: Community;

    /**
     * 住戶
     */
    resident: CharacterResident;

    /**
     * 車位號碼
     */
    name: string;

    /**
     * 車位管理費
     */
    cost: number;

    /**
     * 刪除
     */
    isDeleted: boolean;
}

@registerSubclass()
export class Parking extends ParseObject<IParking> {}

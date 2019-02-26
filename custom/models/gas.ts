import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { CharacterResident } from '.';

/**
 * 瓦斯
 */
export interface IGas {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 住戶
     */
    resident: CharacterResident;

    /**
     * 月份
     */
    date: Date;

    /**
     * 截止日
     */
    deadline: Date;

    /**
     * 度數
     */
    degree: number;
}

@registerSubclass()
export class Gas extends ParseObject<IGas> {}

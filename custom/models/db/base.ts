import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/**
 * 基本屬性
 */
export interface IBase {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 刪除人
     */
    deleter: Parse.User;

    /**
     * 刪除
     */
    isDeleted: boolean;
}

@registerSubclass()
export class Base extends ParseObject<IBase> {}

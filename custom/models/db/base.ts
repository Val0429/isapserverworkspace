import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

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

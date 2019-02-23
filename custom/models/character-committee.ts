import { registerSubclass, ParseObject } from '../../../helpers/parse-server/parse-helper';

/**
 * 管委會
 */
export interface ICharacterCommittee {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 使用者
     */
    user: Parse.User;

    /**
     * 權限
     */
    permission: string;

    /**
     * 調整原因
     */
    adjustReason: string;
}

@registerSubclass()
export class CharacterCommittee extends ParseObject<ICharacterCommittee> {}
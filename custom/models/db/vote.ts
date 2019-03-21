import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Community, CharacterResident } from './_index';
import * as Enum from '../../enums';

interface IVoteOption {
    option: string;
    residents: CharacterResident[];
}

/**
 * 投票
 */
export interface IVote {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 社區
     */
    community: Community;

    /**
     * 發起時間
     */
    date: Date;

    /**
     * 截止日
     */
    deadline: Date;

    /**
     * 主旨
     */
    title: string;

    /**
     * 內容
     */
    content: string;

    /**
     * 選項
     */
    options: IVoteOption[];

    /**
     * 狀態
     */
    status: Enum.ReceiveStatus;

    /**
     * 投票範圍
     */
    aims: Enum.ResidentCharacter[];

    /**
     * 刪除
     */
    isDeleted: boolean;
}

@registerSubclass()
export class Vote extends ParseObject<IVote> {}

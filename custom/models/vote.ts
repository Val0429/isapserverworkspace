import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Enum from '../enums';
import { CharacterResident } from './';

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
}

@registerSubclass()
export class Vote extends ParseObject<IVote> {}

import * as Enum from '../../enums';

interface IVoteOption {
    option: string;
    count: number;
}

export interface IIndexC {
    voteId: string;
}

export interface IIndexR {
    voteId: string;
    date: Date;
    deadline: Date;
    title: string;
    content: string;
    options: string[];
    status: Enum.ReceiveStatus;
    sponsorName: string;
}

export interface IBilling {
    total: number;
    options: IVoteOption[];
}
import * as Enum from '../../enums';

export interface IIndexC {
    date: Date;
    deadline: Date;
    title: string;
    content: string;
    options: string[];
    aims: Enum.ResidentCharacter[];
}

export interface IIndexR {
    start?: Date;
    end?: Date;
    status: 'all' | 'received' | 'unreceived';
}

export interface IIndexU extends IIndexC {
    voteId: string;
}

export interface IIndexD {
    voteIds: string | string[];
}

export interface IBilling {
    voteId: string;
}

export interface IVoting {
    voteId?: string;
    option: string;
}

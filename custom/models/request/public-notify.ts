import * as Enum from '../../enums';

export interface IIndexBase {
    date: Date;
    title: string;
    content: string;
    attachment?: string;
}

export interface IIndexC extends IIndexBase {
    aims: Enum.ResidentCharacter[];
}

export interface IIndexR {
    start?: Date;
    end?: Date;
}

export interface IIndexU extends IIndexBase {
    publicNotifyId: string;
}

export interface IIndexD {
    publicNotifyIds: string | string[];
}

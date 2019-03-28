import * as Enum from '../../enums';

export interface IIndexC {
    publicNotifyId: string;
}

export interface IIndexR {
    publicNotifyId: string;
    date: Date;
    title: string;
    content: string;
    attachmentSrc: string;
    creatorName: string;
    aims: Enum.ResidentCharacter[];
    isTop: boolean;
}

import * as Enum from '../../enums';

export interface IIndexC {
    listenId: string;
}

export interface IReply {
    id: string;
    name: string;
    content: string;
    date: Date;
}

export interface IIndexR {
    listenId: string;
    residentId: string;
    residentAddress: string;
    date: Date;
    title: string;
    content: string;
    status: Enum.ReceiveStatus;
    attachmentSrc: string;
    replys: IReply[];
}

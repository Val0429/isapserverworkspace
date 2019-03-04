import * as Enum from '../../enums';

export interface IIndexC {
    listenId: string;
}

export interface IIndexR {
    listenId: string;
    residentId: string;
    residentAddress: string;
    date: Date;
    title: string;
    content: string;
    replyId: string;
    replyName: string;
    replyContent: string;
    replyDate: Date;
    status: Enum.ReceiveStatus;
    attachmentSrc: string;
}
